// The RECRUITING-SEASON Apply page. The wiki decides what is on it: GET
// /api/recruit/site names the cycle receiving the website and its three forms
// (interest, coffee chats, application), each with an open flag and a
// question list edited in the wiki's Applications settings. This page draws
// whatever is open from those lists, so the team changes a form there and the
// site follows on the next load. When nothing is open it renders ApplyClosed.
// The live variant is chosen by APPLY_ACTIVE in Apply.jsx (see README,
// "Apply page: what it shows").
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SiteFooter from '../components/SiteFooter';
import ApplyClosed from './ApplyClosed';
import { loadDraft, saveDraft, clearDraft, loadLegacyInterestDraft } from '../interestDraft';
import { FALLBACK_SITE, FILE_TYPES, MAX_FILE_BYTES, formKeyFromSearch } from '../data/applyForms';
import './Apply.css';

// Submissions go to the wiki's backend: same Postgres and email the team
// already runs, nothing third-party. Locally, `npm run dev` in the wiki repo
// serves the same API on 4870.
const API = import.meta.env.DEV
  ? 'http://127.0.0.1:4870'
  : 'https://wiki.cornellphysicalintelligence.com';

const CONTACT_EMAIL = 'cuphysint@cornell.edu';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Button, confirmation, and closing note per form. A form the wiki adds
// later gets the plain wording.
const WORDING = {
  interest: {
    submit: 'Join the interest list',
    done: "You're on the list",
    note: 'We read every one of these. Keep an eye on your inbox when recruiting opens.',
    dupe: 'You already joined the interest list with this email',
  },
  coffee: {
    submit: 'Request a coffee chat',
    done: 'Request sent',
    note: 'A member will email you to find a time.',
    dupe: 'You already requested a coffee chat with this email',
  },
  application: {
    submit: 'Send application',
    done: 'Application sent',
    note: "Thanks for applying. We'll be in touch by email.",
    dupe: 'You already applied with this email',
  },
};
const wordingFor = (key) =>
  WORDING[key] || { submit: 'Send', done: 'Sent', note: 'Thanks. We read every one of these.', dupe: 'You already sent this form with this email' };

// The top row of a choice question. Subteam keeps the site's old "Not sure
// yet"; every other choice says what it is waiting for.
const placeholderFor = (q) => (q.key === 'subteam' && !q.required ? 'Not sure yet' : q.key === 'year' ? 'Select your year' : 'Select one');

const idFor = (section, q) => `apply-${section.key}-${q.key}`;

// The site rule is no native pickers on styled surfaces, so a choice control
// is a listbox with roving focus: arrows move, Enter picks, Esc returns to
// the button, and a click anywhere else closes it.
function InterestSelect({ value, onChange, options, labelId, required = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDocDown);
    return () => document.removeEventListener('pointerdown', onDocDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const list = listRef.current;
    const button = buttonRef.current;
    const viewport = window.visualViewport;
    let opensAbove;
    const fitHeight = () => {
      const rect = button.getBoundingClientRect();
      const topEdge = Math.max((viewport?.offsetTop || 0) + 8, (document.querySelector('.menu-bar')?.getBoundingClientRect().bottom || 0) + 8);
      const bottomEdge = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight) - 8;
      const above = Math.max(0, rect.top - 6 - topEdge);
      const below = Math.max(0, bottomEdge - rect.bottom - 6);
      const desired = Math.min(280, list.scrollHeight + 2);
      // Choose a side once. Scrolling must never move or flip the menu
      // relative to its field; CSS keeps both in the same scrolling layer.
      opensAbove ??= below < desired && above > below;
      list.dataset.placement = opensAbove ? 'above' : 'below';
      list.style.maxHeight = `${Math.min(desired, opensAbove ? above : below)}px`;
    };
    // Only screen/keyboard size changes need a new height, not scroll events.
    fitHeight();
    const selected = list.querySelector('[aria-selected="true"]');
    selected?.focus({ preventScroll: true });
    if (selected) list.scrollTop = Math.max(0, selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2);
    const onFocus = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener('resize', fitHeight);
    document.addEventListener('focusin', onFocus);
    viewport?.addEventListener('resize', fitHeight);
    return () => {
      window.removeEventListener('resize', fitHeight);
      document.removeEventListener('focusin', onFocus);
      viewport?.removeEventListener('resize', fitHeight);
    };
  }, [open]);

  const pick = (option) => {
    onChange(option);
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  const onListKeyDown = (event) => {
    const items = [...(listRef.current?.querySelectorAll('[role="option"]') ?? [])];
    const at = items.indexOf(document.activeElement);
    const focusOption = (option) => {
      if (!option) return;
      option.focus({ preventScroll: true });
      const list = listRef.current;
      const top = option.offsetTop, bottom = top + option.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    };
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(items[Math.min(at + 1, items.length - 1)]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(items[Math.max(at - 1, 0)]);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(items[0]);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(items[items.length - 1]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pick(document.activeElement?.dataset.value ?? value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus({ preventScroll: true });
    } else if (event.key === 'Tab') {
      // Advance from the field's trigger, not a soon-to-be-removed option.
      buttonRef.current?.focus({ preventScroll: true });
      setOpen(false);
    }
  };

  return (
    <div className="ifz-dd" ref={rootRef}>
      <button
        id={`${labelId}-control`}
        type="button"
        className="ifz-dd__button"
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${labelId}-value`}
        aria-controls={open ? `${labelId}-options` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={`${labelId}-value`}>{value}</span>
        <svg className="ifz-dd__chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul id={`${labelId}-options`} className="ifz-dd__list" role="listbox" aria-labelledby={labelId} aria-required={required || undefined} ref={listRef} onKeyDown={onListKeyDown}>
          {options.map((option) => (
            <li
              key={option}
              role="option"
              tabIndex={-1}
              data-value={option}
              aria-selected={option === value}
              onClick={() => pick(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// What a file question accepts, in words and in types.
const fileRules = (q) => {
  const types = Array.isArray(q.accept) && q.accept.length ? q.accept.filter((t) => FILE_TYPES.includes(t)) : FILE_TYPES;
  const maxBytes = Math.min(Number(q.maxBytes) > 0 ? Number(q.maxBytes) : MAX_FILE_BYTES, MAX_FILE_BYTES);
  const images = types.some((t) => t.startsWith('image/'));
  const pdf = types.includes('application/pdf');
  const kinds = images && pdf ? 'a photo or PDF' : pdf ? 'a PDF' : 'an image';
  const only = images && pdf ? 'Images or PDF only' : pdf ? 'PDF only' : 'Images only';
  const cap = maxBytes === MAX_FILE_BYTES ? '2.5 MB' : `${Math.round(maxBytes / 1024)} KB`;
  return { types, maxBytes, kinds, only, cap };
};

// One box answers a written question and takes its file: type in it, drag a
// file onto it, or use the corner upload icon. A file question on its own is
// the same box without the text. Every file is checked here before a byte is
// uploaded.
function FileBox({ id, textQuestion, text, onText, fileQuestion, file, onFile, onProblem }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const rules = fileRules(fileQuestion);

  const accept = (candidate) => {
    if (!candidate) return;
    if (!rules.types.includes(candidate.type)) {
      onProblem(`${rules.only} for ${textQuestion ? 'the file' : fileQuestion.label}.`);
      return;
    }
    if (candidate.size > rules.maxBytes) {
      onProblem(`Files are capped at ${rules.cap}.`);
      return;
    }
    onProblem('');
    onFile(candidate);
  };

  return (
    <div
      className={`ifz-projectbox ${textQuestion ? '' : 'ifz-projectbox--file'} ${dragOver ? 'is-over' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        accept(event.dataTransfer?.files?.[0]);
      }}
    >
      {textQuestion ? (
        <textarea
          id={id}
          className="ifz-projectbox__text"
          value={text}
          onChange={(event) => onText(event.target.value)}
          maxLength={textQuestion.max || 1000}
          placeholder={textQuestion.help || ''}
        />
      ) : null}
      {file ? (
        <div className="ifz-file">
          <span className="ifz-file__name">{file.name}</span>
          <span className="ifz-file__size">{Math.max(1, Math.round(file.size / 1024))} KB</span>
          <button type="button" className="ifz-file__remove" aria-label={`Remove ${file.name}`} onClick={() => onFile(null)}>
            ×
          </button>
        </div>
      ) : (
        // A labelled row, not a corner icon: on a phone there is nothing to
        // drag, so the control has to say what it does.
        <button id={textQuestion ? undefined : id} type="button" className="ifz-attach" onClick={() => inputRef.current?.click()}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 15V4m5 4-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{textQuestion ? `Attach ${rules.kinds}` : `Choose ${rules.kinds}`}</span>
          <small>up to {rules.cap}</small>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={rules.types.join(',')}
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsDataURL(file);
  });

// A written question directly followed by a file question shares one box
// with it, the way the interest form's project question always has.
const rowsOf = (questions) => {
  const rows = [];
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const next = questions[i + 1];
    if (q.type === 'long' && next?.type === 'file') {
      rows.push({ q, file: next });
      i += 1;
    } else rows.push({ q });
  }
  return rows;
};

// Answers to start from: the saved draft where it still fits the form.
const initialState = (section, draft) => {
  const values = {};
  const cues = {};
  for (const q of section.form.questions) {
    const v = draft?.[q.key];
    if (q.type === 'file') {
      if (typeof draft?.[`F_${q.key}`] === 'string') cues[q.key] = draft[`F_${q.key}`];
    } else if (q.type === 'single') values[q.key] = typeof v === 'string' && (q.options || []).includes(v) ? v : '';
    else if (q.type === 'multi') values[q.key] = Array.isArray(v) ? v.filter((x) => (q.options || []).includes(x)) : [];
    else if (q.type === 'checkbox') values[q.key] = v === true;
    else values[q.key] = typeof v === 'string' ? v : '';
  }
  return { values, cues };
};

function SectionForm({ section, cycle }) {
  const questions = section.form.questions;
  const wording = wordingFor(section.key);
  const [start] = useState(() => initialState(section, loadDraft(section.key) || (section.key === 'interest' ? loadLegacyInterestDraft() : null)));
  const [values, setValues] = useState(start.values);
  const [files, setFiles] = useState({});
  // Names of files a restored draft had attached, until they are attached again.
  const [cues, setCues] = useState(start.cues);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  // Set when the server says this address already sent this form: holds the
  // earlier date so the visitor can decide whether to replace it.
  const [duplicate, setDuplicate] = useState(null);
  const honeypotRef = useRef(null);

  const draftOf = () => {
    const out = { ...values };
    for (const q of questions) {
      if (q.type !== 'file') continue;
      const name = files[q.key]?.name || cues[q.key];
      if (name) out[`F_${q.key}`] = name;
    }
    return out;
  };

  useEffect(() => {
    if (status === 'done') return;
    const out = { ...values };
    for (const q of questions) {
      if (q.type !== 'file') continue;
      const name = files[q.key]?.name || cues[q.key];
      if (name) out[`F_${q.key}`] = name;
    }
    saveDraft(section.key, out);
  }, [values, files, cues, status, section.key, questions]);

  const setValue = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));
  const setFile = (key, f) => {
    setFiles((prev) => ({ ...prev, [key]: f }));
    setCues((prev) => ({ ...prev, [key]: '' }));
  };

  // The same checks the wiki makes, so a miss is caught before the upload.
  const problem = () => {
    for (const q of questions) {
      const v = values[q.key];
      const id = idFor(section, q);
      const label = q.label || q.key;
      const at = (suffix = '') => `${id}${suffix}`;
      if (q.type === 'file') {
        if (q.required && !files[q.key]) return [`Attach ${fileRules(q).kinds} for ${label}.`, at()];
        continue;
      }
      if (q.key === 'name' && !String(v).trim()) return ['Tell us your name.', at()];
      if (q.type === 'email') {
        const clean = String(v).trim();
        if ((q.required || clean) && !EMAIL_RE.test(clean)) return [q.key === 'email' ? 'That email does not look right.' : `${label} does not look like an email.`, at()];
        continue;
      }
      if (q.type === 'single' && q.required && !v) return [q.key === 'year' ? 'Choose your year first.' : `Choose an option for ${label}.`, at('-label-control')];
      if (q.type === 'multi' && q.required && !v.length) return [`Choose at least one option for ${label}.`, at()];
      if (q.type === 'checkbox' && q.required && !v) return [`${label} must be checked.`, at()];
      if (q.type === 'link' && String(v).trim() && !/^https?:\/\/\S+$/i.test(String(v).trim())) return [`${label} must start with http:// or https://.`, at()];
      if ((q.type === 'short' || q.type === 'long' || q.type === 'link') && q.required && !String(v).trim()) return [`${label} is required.`, at()];
    }
    return null;
  };

  const send = async (confirmUpdate) => {
    const miss = problem();
    if (miss) {
      setError(miss[0]);
      document.getElementById(miss[1])?.focus();
      return;
    }
    setError('');
    setStatus('sending');
    const snapshot = draftOf();
    saveDraft(section.key, snapshot);
    try {
      const answers = {};
      for (const q of questions) {
        if (q.type === 'file') continue;
        const v = values[q.key];
        answers[q.key] = typeof v === 'string' ? v.trim() : v;
      }
      const attached = {};
      for (const q of questions) {
        if (q.type === 'file' && files[q.key]) attached[q.key] = { name: files[q.key].name, type: files[q.key].type, data: await readAsBase64(files[q.key]) };
      }
      const website = honeypotRef.current?.value || '';
      const extra = confirmUpdate ? { confirmUpdate: true } : {};
      // Until the wiki has a cycle receiving the website, the interest form
      // still lands in its old inbox through its old route and flat body.
      const legacy = !cycle && section.key === 'interest';
      const res = await fetch(legacy ? `${API}/api/interest` : `${API}/api/recruit/site/${encodeURIComponent(section.key)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(legacy ? { ...answers, file: attached.file || null, website, ...extra } : { answers, files: attached, website, ...extra }),
      });
      const out = await res.json().catch(() => ({}));
      // Already sent: ask before overwriting what they sent before, unless
      // the wiki says this form never replaces an earlier submission.
      if (res.status === 409 && out.exists) {
        setStatus('idle');
        if (out.replaceable === false) { setError(out.error || 'You already sent this form with this email.'); return; }
        setDuplicate({ submitted: out.submitted });
        return;
      }
      if (!res.ok) throw new Error(out.error || 'Something went wrong.');
      if (out.ok !== true) throw new Error('We could not confirm your submission. Please try again.');
      clearDraft(section.key, snapshot);
      setDuplicate(null);
      setStatus('done');
    } catch (problem) {
      setStatus('idle');
      setError(`${problem.message || 'Something went wrong.'} You can also email ${CONTACT_EMAIL}.`);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (status === 'sending') return;
    send(false);
  };

  const done = status === 'done';
  const missing = questions.filter((q) => q.type === 'file' && cues[q.key] && !files[q.key]).map((q) => cues[q.key]);
  const attachmentReminder = missing.length ? `Your answers were restored. Attach ${missing.join(' and ')} again if you want to include it.` : '';

  const control = ({ q, file }) => {
    const id = idFor(section, q);
    const v = values[q.key];
    if (q.type === 'file') {
      return <FileBox id={id} fileQuestion={q} file={files[q.key] || null} onFile={(next) => setFile(q.key, next)} onProblem={setError} />;
    }
    if (q.type === 'long') {
      if (file) {
        return <FileBox id={id} textQuestion={q} text={v} onText={(next) => setValue(q.key, next)} fileQuestion={file} file={files[file.key] || null} onFile={(next) => setFile(file.key, next)} onProblem={setError} />;
      }
      return <textarea id={id} className="ifz-input ifz-textarea" value={v} onChange={(event) => setValue(q.key, event.target.value)} maxLength={q.max || 1000} placeholder={q.help || ''} required={q.required} />;
    }
    if (q.type === 'single') {
      const blank = placeholderFor(q);
      return <InterestSelect value={v || blank} onChange={(next) => setValue(q.key, next === blank ? '' : next)} options={[blank, ...(q.options || [])]} labelId={`${id}-label`} required={q.required} />;
    }
    if (q.type === 'multi') {
      return (
        <div className="ifz-checks" role="group" aria-labelledby={`${id}-label`}>
          {(q.options || []).map((option, i) => (
            <label key={option} className="ifz-check">
              <input
                id={i === 0 ? id : undefined}
                type="checkbox"
                checked={v.includes(option)}
                onChange={(event) => setValue(q.key, event.target.checked ? [...v, option] : v.filter((x) => x !== option))}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }
    if (q.type === 'checkbox') {
      return (
        <label className="ifz-check" htmlFor={id}>
          <input id={id} type="checkbox" checked={v === true} onChange={(event) => setValue(q.key, event.target.checked)} />
          {q.help || 'Yes'}
        </label>
      );
    }
    const type = q.type === 'email' ? 'email' : q.type === 'link' ? 'url' : 'text';
    const autoComplete = q.key === 'name' ? 'name' : q.key === 'email' ? 'email' : q.type === 'link' ? 'url' : undefined;
    const placeholder = q.help || (q.key === 'email' ? 'netid@cornell.edu' : q.type === 'link' ? 'https://' : '');
    return (
      <input
        id={id}
        className="ifz-input"
        type={type}
        inputMode={q.type === 'email' ? 'email' : q.type === 'link' ? 'url' : undefined}
        value={v}
        onChange={(event) => setValue(q.key, event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={q.max || (q.type === 'link' ? 500 : 200)}
        required={q.required}
      />
    );
  };

  // Success never swaps the layout out from under the visitor: the submit
  // button itself becomes the confirmation, holds a beat, and everything
  // above it slides away (the delays live in the CSS).
  return (
    <form className={`ifz ${done ? 'ifz--done' : ''}`} onSubmit={submit} noValidate>
      <div className="ifz-away" inert={done || undefined} aria-hidden={done}>
        <div className="ifz-away__in">
          {section.description && <p className="apply-page__intro">{section.description}</p>}
          {rowsOf(questions).map((row) => {
            const { q } = row;
            const id = idFor(section, q);
            const labelled = q.type === 'single' || q.type === 'multi' || q.type === 'checkbox' || (q.type === 'file' && !row.file);
            return (
              <div className="ifz-field" key={q.key}>
                {labelled ? (
                  <span className="ifz-label" id={`${id}-label`}>{q.label}</span>
                ) : (
                  <label className="ifz-label" htmlFor={id}>{q.label}</label>
                )}
                {control(row)}
                {q.help && (q.type === 'single' || q.type === 'multi' || q.type === 'file') && <p className="ifz-help">{q.help}</p>}
              </div>
            );
          })}
          {/* Honeypot: humans never see it, autofill and bots do. */}
          <input
            ref={honeypotRef}
            className="ifz-honeypot"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <p className={`ifz-error ${error || attachmentReminder ? 'is-visible' : ''}`} role="alert" aria-live="polite">
            {[error, attachmentReminder].filter(Boolean).join(' ')}
          </p>
        </div>
      </div>
      {duplicate && (
        <div className="ifz-dupe" role="alertdialog" aria-label="Already sent">
          <p className="ifz-dupe__text">
            {wording.dupe}
            {duplicate.submitted
              ? ` on ${new Date(duplicate.submitted).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
              : ''}
            . Sending this replaces your earlier answers.
          </p>
          <div className="ifz-dupe__actions">
            <button type="button" className="ifz-dupe__cancel" onClick={() => setDuplicate(null)}>
              Cancel
            </button>
            <button type="button" className="ifz-dupe__ok" onClick={() => send(true)} disabled={status === 'sending'}>
              {status === 'sending' ? 'Replacing...' : 'OK, replace it'}
            </button>
          </div>
        </div>
      )}
      <button className="ifz-submit" type="submit" disabled={status !== 'idle' || Boolean(duplicate)} aria-live="polite">
        {done ? (
          <>
            <svg className="ifz-check" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {wording.done}
          </>
        ) : status === 'sending' ? (
          'Sending...'
        ) : (
          wording.submit
        )}
      </button>
      {done && <p className="ifz-done-note">{wording.note}</p>}
    </form>
  );
}

// What the wiki publishes: null while it answers, then the cycle and its
// forms, or the built-in interest form when it cannot be reached.
function useSite() {
  const [site, setSite] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/recruit/site`, { cache: 'no-store', signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((out) => setSite(Array.isArray(out?.sections) ? out : FALLBACK_SITE))
      .catch(() => {
        if (!controller.signal.aborted) setSite(FALLBACK_SITE);
      });
    return () => controller.abort();
  }, []);
  return site;
}

const isOpen = (s) => s?.open === true && Array.isArray(s.form?.questions) && s.form.questions.length > 0;

// One form at its own address: a white page, no menu, no footer, just the
// form the wiki publishes under that key. Closed forms say so and point at
// the Apply page.
function FormPage({ formKey }) {
  const site = useSite();
  const section = (site?.sections || []).find((s) => s?.key === formKey) || null;
  const open = isOpen(section);
  return (
    <main className="alt-page alt-page--apply alt-page--form">
      <section className="alt-section alt-section--apply">
        <div className="apply-page">
          {site && !open && (
            <p className="apply-page__intro">
              This form is closed right now. <a className="apply-page__link" href="/apply/">See what is open</a>.
            </p>
          )}
          {open && (
            <>
              <h1 className="apply-page__title">{section.title}</h1>
              <SectionForm key={`${site.cycle?.id || 'legacy'}:${section.key}`} section={section} cycle={site.cycle} />
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export function ApplyInterest() { return <FormPage formKey="interest" />; }
export function ApplyCoffee() { return <FormPage formKey="coffee" />; }
export function ApplyApplication() { return <FormPage formKey="application" />; }



// /apply is where the QR code and the menu land: one form, the one the wiki
// marks for it, else the first open one. The other open forms live at their
// own addresses (/apply/coffee/ and so on).
export default function ApplyOpen() {
  const asked = typeof window === 'undefined' ? '' : formKeyFromSearch(window.location.search);
  if (asked) return <FormPage formKey={asked} />;
  return <ApplyLanding />;
}

function ApplyLanding() {
  const site = useSite();
  const open = (site?.sections || []).filter(isOpen);
  const active = open.find((s) => s.key === site?.landing) || open[0];
  if (site && !active) return <ApplyClosed />;

  return (
    <main className="alt-page alt-page--apply">
      <h1 className="visually-hidden">Cornell Physical Intelligence Applications</h1>
      <section className="alt-section alt-section--apply">
        <div className="apply-page">
          {active && <SectionForm key={`${site.cycle?.id || 'legacy'}:${active.key}`} section={active} cycle={site.cycle} />}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
