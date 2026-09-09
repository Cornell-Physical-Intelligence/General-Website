// The RECRUITING-SEASON Apply page: just the interest form. The crab lives
// only on the off-season page (ApplyClosed). Do not rewrite or restyle this —
// it is finished and reviewed. The live variant is chosen by APPLY_ACTIVE in
// Apply.jsx (see README, "Apply page: open vs closed").
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SiteFooter from '../components/SiteFooter';
import './Apply.css';

// Submissions go to the wiki's backend: same Postgres and email the team
// already runs, nothing third-party. Locally, `npm run dev` in the wiki repo
// serves the same API on 4870.
const INTEREST_API = import.meta.env.DEV
  ? 'http://127.0.0.1:4870'
  : 'https://wiki.cornellphysicalintelligence.com';

const CONTACT_EMAIL = 'cuphysint@cornell.edu';
const SUBTEAMS = ['Not sure yet', 'Mechanical', 'Electrical', 'Software', 'Creative', 'Business & Marketing'];
const YEARS = ['Select your year', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'];
const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_FILE_BYTES = 2.5 * 1024 * 1024;

// The site rule is no native pickers on styled surfaces, so the subteam
// control is a listbox with roving focus: arrows move, Enter picks, Esc
// returns to the button, and a click anywhere else closes it.
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

// One box answers the project question: type in it, drag a file onto it, or
// use the corner upload icon. Every file is checked here before a byte is
// uploaded.
function ProjectBox({ project, onProject, file, onFile, onProblem }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const accept = (candidate) => {
    if (!candidate) return;
    if (!FILE_TYPES.includes(candidate.type)) {
      onProblem('Images or PDF only for the file.');
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      onProblem('Files are capped at 2.5 MB.');
      return;
    }
    onProblem('');
    onFile(candidate);
  };

  return (
    <div
      className={`ifz-projectbox ${dragOver ? 'is-over' : ''}`}
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
      <textarea
        id="interest-project"
        className="ifz-projectbox__text"
        value={project}
        onChange={(event) => onProject(event.target.value)}
        maxLength={1000}
        placeholder="Tell us about it, or drop a photo or PDF right here..."
      />
      {file ? (
        <div className="ifz-file">
          <span className="ifz-file__name">{file.name}</span>
          <span className="ifz-file__size">{Math.max(1, Math.round(file.size / 1024))} KB</span>
          <button type="button" className="ifz-file__remove" aria-label={`Remove ${file.name}`} onClick={() => onFile(null)}>
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="ifz-attach"
          aria-label="Attach a photo or PDF"
          title="Attach a photo or PDF"
          onClick={() => inputRef.current?.click()}
        >
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
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={FILE_TYPES.join(',')}
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

function InterestForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subteam, setSubteam] = useState(SUBTEAMS[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [project, setProject] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  // Set when the server says this address already joined: holds the earlier
  // date so the visitor can decide whether to replace it.
  const [duplicate, setDuplicate] = useState(null);
  const honeypotRef = useRef(null);

  const send = async (confirmUpdate) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName) {
      setError('Tell us your name.');
      document.getElementById('interest-name')?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setError('That email does not look right.');
      document.getElementById('interest-email')?.focus();
      return;
    }
    if (!YEARS.slice(1).includes(year)) {
      setError('Choose your year before joining the list.');
      document.getElementById('interest-year-label-control')?.focus();
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const payload = {
        name: cleanName,
        email: cleanEmail,
        subteam: subteam === SUBTEAMS[0] ? '' : subteam,
        year,
        project: project.trim(),
        file: file ? { name: file.name, type: file.type, data: await readAsBase64(file) } : null,
        website: honeypotRef.current?.value || '',
        ...(confirmUpdate ? { confirmUpdate: true } : {}),
      };
      const res = await fetch(`${INTEREST_API}/api/interest`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({}));
      // Already on the list: ask before overwriting what they sent before.
      if (res.status === 409 && out.exists) {
        setStatus('idle');
        setDuplicate({ submitted: out.submitted });
        return;
      }
      if (!res.ok) throw new Error(out.error || 'Something went wrong.');
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

  // Success never swaps the layout out from under the visitor: the submit
  // button itself becomes the confirmation, holds a beat, and everything
  // above it slides away (the delays live in the CSS).
  return (
    <form className={`ifz ${done ? 'ifz--done' : ''}`} onSubmit={submit} noValidate>
      <div className="ifz-away" inert={done || undefined} aria-hidden={done}>
        <div className="ifz-away__in">
          <p className="apply-page__intro">Fill in the information below to display interest in applying to CUPI.</p>
          <div className="ifz-field">
            <label className="ifz-label" htmlFor="interest-name">
              Name
            </label>
            <input
              id="interest-name"
              className="ifz-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={100}
              required
            />
          </div>
          <div className="ifz-field">
            <label className="ifz-label" htmlFor="interest-email">
              Email
            </label>
            <input
              id="interest-email"
              className="ifz-input"
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="netid@cornell.edu"
              maxLength={200}
              required
            />
          </div>
          <div className="ifz-field">
            <span className="ifz-label" id="interest-year-label">
              Year <span className="ifz-field-note">(required)</span>
            </span>
            <InterestSelect value={year} onChange={setYear} options={YEARS} labelId="interest-year-label" required />
          </div>
          <div className="ifz-field">
            <span className="ifz-label" id="interest-subteam-label">
              Subteam of interest
            </span>
            <InterestSelect value={subteam} onChange={setSubteam} options={SUBTEAMS} labelId="interest-subteam-label" />
          </div>
          <div className="ifz-field">
            <label className="ifz-label" htmlFor="interest-project">
              What&apos;s the coolest project you&apos;ve done?
            </label>
            <ProjectBox project={project} onProject={setProject} file={file} onFile={setFile} onProblem={setError} />
          </div>
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
          <p className={`ifz-error ${error ? 'is-visible' : ''}`} role="alert" aria-live="polite">
            {error}
          </p>
        </div>
      </div>
      {duplicate && (
        <div className="ifz-dupe" role="alertdialog" aria-label="Already on the list">
          <p className="ifz-dupe__text">
            You already joined the interest list with this email
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
            You&apos;re on the list
          </>
        ) : status === 'sending' ? (
          'Sending...'
        ) : (
          'Join the interest list'
        )}
      </button>
      {done && (
        <p className="ifz-done-note">We read every one of these. Keep an eye on your inbox when recruiting opens.</p>
      )}
    </form>
  );
}

export default function ApplyOpen() {
  return (
    <main className="alt-page alt-page--apply">
      <h1 className="visually-hidden">Cornell Physical Intelligence Applications</h1>
      <section className="alt-section alt-section--apply">
        <div className="apply-page">
          <InterestForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
