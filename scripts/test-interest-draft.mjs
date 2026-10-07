// Synthetic answers and a mocked browser/network. Exercise the actual form's
// submit handler without sending an application or reading personal data.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { transformWithOxc } from 'vite';
import { DRAFT_PREFIX, INTEREST_DRAFT_TTL, loadDraft, saveDraft, clearDraft } from '../src/interestDraft.js';
// A sample of what the wiki publishes: the interest form as a new cycle has it.
const SAMPLE_SITE = {
  cycle: null,
  sections: [{
    key: 'interest', title: 'Interest form', description: 'Fill in the information below to display interest in applying to CUPI.', open: true,
    form: { questions: [
      { key: 'name', type: 'short', label: 'Name', required: true, max: 100 },
      { key: 'email', type: 'email', label: 'Email', required: true, max: 200 },
      { key: 'subteam', type: 'single', label: 'Subteam of interest', required: false, options: ['Mechanical', 'Electrical', 'Software', 'Creative', 'Business & Marketing'] },
      { key: 'year', type: 'single', label: 'Year', required: true, options: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'] },
      { key: 'project', type: 'long', label: "What's the coolest project you've done?", required: false, help: 'Tell us about it, or drop a photo or PDF right here...', max: 1000 },
      { key: 'file', type: 'file', label: 'Photo or PDF of it', required: false, accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'], maxBytes: 2.5 * 1024 * 1024 },
    ] },
  }],
};

const KEY = `${DRAFT_PREFIX}cy-test:interest`;
const entries = new Map();
const storage = {
  getItem: (key) => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
  removeItem: (key) => entries.delete(key),
};
const longestKey = 'a'.repeat(40);
const longDraft = {essay:'x'.repeat(20000), ['F_' + longestKey]:'resume.pdf'};
saveDraft('cycle-a:custom',longDraft,storage,100);
assert.deepEqual(loadDraft('cycle-a:custom',storage,101),longDraft,'long answers and file cues for 40-character keys survive');
assert.equal(loadDraft('cycle-b:custom',storage,101),null,'another cycle never inherits these answers');
const draft = { name: 'Test Member', email: 'synthetic@example.test', year: 'Freshman', subteam: 'Software', project: 'A synthetic robot', F_file: 'robot.pdf' };
assert.equal(saveDraft('cy-test:interest', { ...draft, file: { data: 'NEVER STORE FILE BYTES' }, 'bad key!': 'x' }, storage, 100), true);
assert.deepEqual(loadDraft('cy-test:interest', storage, 101), draft);
assert.ok(!storage.getItem(KEY).includes('NEVER STORE FILE BYTES'));
assert.equal(loadDraft('cy-test:interest', storage, 100 + INTEREST_DRAFT_TTL), null, 'expired answers are removed');
assert.equal(storage.getItem(KEY), null);
storage.setItem(KEY, '{broken');
assert.equal(loadDraft('cy-test:interest', storage), null, 'corrupt browser storage does not break the form');
const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Full'); } };
assert.equal(saveDraft('cy-test:interest', draft, blocked), false);
assert.equal(loadDraft('cy-test:interest', blocked), null);
assert.doesNotThrow(() => clearDraft('cy-test:interest', draft, blocked));
saveDraft('cy-test:interest', { ...draft, project: 'Newer draft in another tab' }, storage);
clearDraft('cy-test:interest', draft, storage);
assert.equal(loadDraft('cy-test:interest', storage).project, 'Newer draft in another tab', 'a previous successful request cannot erase newer answers');
saveDraft('coffee', { name: 'Someone Else', availability: 'Tuesdays' }, storage);
assert.equal(loadDraft('coffee', storage).availability, 'Tuesdays', 'each form keeps its own draft');
assert.equal(loadDraft('cy-test:interest', storage).project, 'Newer draft in another tab');
entries.clear();
entries.clear();

const dir = await mkdtemp(join(tmpdir(), 'cupi-form-test-'));
const previousWindow = globalThis.window;
const previousFetch = globalThis.fetch;
const previousDocument = globalThis.document;
const previousFileReader = globalThis.FileReader;
try {
  await mkdir(join(dir, 'src/pages'), { recursive: true });
  await mkdir(join(dir, 'src/data'), { recursive: true });
  await mkdir(join(dir, 'node_modules/react'), { recursive: true });
  await writeFile(join(dir, 'package.json'), '{"type":"module"}');
  await writeFile(join(dir, 'node_modules/react/package.json'), '{"type":"module","exports":{".":"./index.js","./jsx-runtime":"./jsx-runtime.js"}}');
  await writeFile(join(dir, 'node_modules/react/index.js'), `
    export const useState = (...args) => globalThis.formHooks.useState(...args);
    export const useEffect = (...args) => globalThis.formHooks.useEffect(...args);
    export const useLayoutEffect = useEffect;
    export const useRef = (value) => useState(() => ({ current: value }))[0];
  `);
  await writeFile(join(dir, 'node_modules/react/jsx-runtime.js'), 'export const jsx = (type, props) => ({type, props}); export const jsxs = jsx; export const Fragment = "fragment";');
  await cp(new URL('../src/interestDraft.js', import.meta.url), join(dir, 'src/interestDraft.js'));
  await cp(new URL('../src/data/applyForms.js', import.meta.url), join(dir, 'src/data/applyForms.js'));
  const source = (await readFile(new URL('../src/pages/ApplyOpen.jsx', import.meta.url), 'utf8'))
    .replace("import SiteFooter from '../components/SiteFooter';", 'const SiteFooter = () => null;')
    .replace("import ApplyClosed from './ApplyClosed';", 'const ApplyClosed = () => ({ type: "closed", props: {} });')
    .replace("import './Apply.css';", '')
    .replace("from '../interestDraft'", "from '../interestDraft.js'")
    .replace("from '../data/applyForms'", "from '../data/applyForms.js'")
    .replace('import.meta.env.DEV', 'false')
    .replace('const RETRY_MS = [1500, 4000];', 'const RETRY_MS = [0, 0];')
    .replace('const SEND_TIMEOUT_MS = 60000;', 'const SEND_TIMEOUT_MS = 30;')
    .replace('const FEED_TIMEOUT_MS = 15000;', 'const FEED_TIMEOUT_MS = 30;')
    .replace('const UPLOAD_BYTES_PER_MS = 16;', 'const UPLOAD_BYTES_PER_MS = 1e9;');
  assert.ok(source.includes('const RETRY_MS = [0, 0];'), 'retries wait no time in tests');
  const compiled = await transformWithOxc(source, 'ApplyOpen.jsx', { jsx: { runtime: 'automatic' } });
  await writeFile(join(dir, 'src/pages/ApplyOpen.js'), compiled.code);
  globalThis.window = { localStorage: storage, location: { search: '' } };
  globalThis.document = { getElementById: () => null };
  let automaticRequests = 0;
  globalThis.fetch = async () => { automaticRequests++; throw new Error('Unexpected automatic submission'); };
  const { default: Apply } = await import(pathToFileURL(join(dir, 'src/pages/ApplyOpen.js')));
  const walk = (node, predicate) => {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const found = walk(child, predicate);
      if (found) return found;
    }
    return null;
  };
  let slots, cursor, effects;
  const resetMount = () => { slots = []; };
  globalThis.formHooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, n) => !Object.is(value, slots[index][n]))) effects.push(effect);
      slots[index] = deps;
    },
  };
  const text = (tree, needle) => walk(tree, (node) => typeof node.props?.children === 'string' && node.props.children.includes(needle));

  // The page itself: it asks the wiki once, shows the interest form the wiki
  // publishes, and shows the closed page when nothing is open.
  // The page's root components hand off to others; run them the way React would, hooks and all.
  const unwrap = (el) => (el && typeof el.type === 'function' ? unwrap(el.type(el.props)) : el);
  const pageWith = async (site, draw = () => unwrap(Apply())) => {
    globalThis.fetch = async () => (site instanceof Error ? Promise.reject(site) : { ok: true, json: async () => site });
    resetMount();
    cursor = 0; effects = [];
    draw();
    effects.forEach((effect) => effect());
    await new Promise((resolve) => setTimeout(resolve, 20));
    cursor = 0; effects = [];
    return draw();
  };
  const downPage = await pageWith(new Error('wiki unreachable'));
  assert.ok(!walk(downPage, (node) => node.type?.name === 'SectionForm'), 'an unreachable wiki shows no form that could not be sent');
  assert.ok(text(downPage, 'We could not load the form right now'), 'it says so and gives the email');
  assert.ok(walk(downPage, (n) => n.props?.className === 'apply-page__retry'), 'and offers to try again');
  {
    let tries = 0;
    const stalled = { cycle: { id: 'cy-1' }, landing: 'interest', sections: SAMPLE_SITE.sections.map((x) => ({ ...x, available: true })) };
    const draw = () => unwrap(Apply());
    globalThis.fetch = (url, init) => { tries += 1; return tries === 1 ? new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))) : Promise.resolve({ ok: true, json: async () => stalled }); };
    resetMount(); cursor = 0; effects = [];
    draw(); effects.forEach((effect) => effect());
    await new Promise((resolve) => setTimeout(resolve, 100));
    cursor = 0; effects = [];
    assert.equal(walk(draw(), (n) => n.type?.name === 'SectionForm')?.props.section.key, 'interest', 'a stalled load is given up and tried again');
    assert.equal(tries, 2);
  }
  {
    let tries = 0;
    const flaky = { cycle: { id: 'cy-1' }, landing: 'interest', sections: SAMPLE_SITE.sections.map((x) => ({ ...x, available: true })) };
    const draw = () => unwrap(Apply());
    globalThis.fetch = async () => { tries += 1; if (tries < 3) throw new Error('dropped'); return { ok: true, json: async () => flaky }; };
    resetMount(); cursor = 0; effects = [];
    draw(); effects.forEach((effect) => effect());
    await new Promise((resolve) => setTimeout(resolve, 30));
    cursor = 0; effects = [];
    assert.equal(walk(draw(), (n) => n.type?.name === 'SectionForm')?.props.section.key, 'interest', 'two dropped loads still end with the form');
    assert.equal(tries, 3);
  }
  const open = (keys, landing = null) => ({ cycle: { id: 'cy-1', name: 'Fall 2026', term: 'Fall 2026', status: 'open' }, landing, sections: SAMPLE_SITE.sections.concat({ key: 'coffee', title: 'Coffee chats', description: '', open: true, form: { questions: [{ key: 'name', type: 'short', label: 'Name', required: true }, { key: 'email', type: 'email', label: 'Email', required: true }] } }).map((s) => ({ ...s, open: keys.includes(s.key), available: keys.includes(s.key) })) });
  const twoOpen = await pageWith(open(['interest', 'coffee']));
  assert.equal(walk(twoOpen, (node) => node.type?.name === 'SectionForm').props.section.key, 'interest', 'with no choice, /apply shows the first open form');
  assert.equal(walk(await pageWith(open(['interest', 'coffee'], 'coffee')), (node) => node.type?.name === 'SectionForm').props.section.key, 'coffee', '/apply shows the form the wiki marks for it');
  assert.equal(walk(await pageWith(open(['interest'], 'coffee')), (node) => node.type?.name === 'SectionForm').props.section.key, 'interest', 'a closed choice falls back to the first open form');
  assert.equal((await pageWith(open([]))).type, 'closed', 'nothing open shows the closed page');
  // Several marked forms open at once: the visitor picks one first, by the wiki's labels.
  const marked = (keys, question = 'Which subteam?') => ({ ...open(keys), apply: { question, choices: [{ key: 'interest', label: 'Join the list' }, { key: 'coffee', label: 'Coffee' }] } });
  const radiosOf = (tree) => { const out = []; walk(tree, (n) => { if (n.props?.className === 'apply-choice') out.push(n); return false; }); return out; };
  const redraw = () => { cursor = 0; effects = []; return unwrap(Apply()); };
  const choosing = await pageWith(marked(['interest', 'coffee']));
  assert.ok(!walk(choosing, (n) => n.type?.name === 'SectionForm'), 'no form until the visitor picks one');
  assert.ok(text(choosing, 'Which subteam?'), "the wiki's question heads the choice");
  assert.deepEqual(radiosOf(choosing).map((r) => r.props.children), ['Join the list', 'Coffee']);
  assert.ok(text(choosing, 'Join the list'), 'each form under its label');
  saveDraft('cy-1:interest', { name: 'Pat Example', email: 'pat@example.test', year: 'Junior', F_file: 'robot.pdf' }, storage);
  radiosOf(choosing)[0].props.onClick();
  let picked = redraw();
  assert.equal(walk(picked, (n) => n.type?.name === 'SectionForm').props.section.key, 'interest', 'picking a form draws it');
  assert.equal(radiosOf(picked)[0].props['aria-pressed'], true);
  radiosOf(picked)[0].props.onClick();
  picked = redraw();
  assert.ok(!walk(picked, (n) => n.type?.name === 'SectionForm'), 'picking it again puts it away');
  assert.ok(radiosOf(picked).every((b) => b.props['aria-pressed'] === false));
  radiosOf(picked)[0].props.onClick();
  picked = redraw();
  radiosOf(picked)[1].props.onClick();
  picked = redraw();
  assert.equal(walk(picked, (n) => n.type?.name === 'SectionForm').props.section.key, 'coffee', 'another pick swaps the form');
  assert.deepEqual(loadDraft('cy-1:coffee', storage), { name: 'Pat Example', email: 'pat@example.test' }, 'the same questions carry over; others and files stay behind');
  entries.clear();
  {
    saveDraft('cy-1:interest', { name: `${'n'.repeat(199)}😀tail`, email: 'pat@example.test' }, storage);
    const page = await pageWith(marked(['interest', 'coffee']));
    radiosOf(page)[0].props.onClick(); redraw();
    radiosOf(redraw())[1].props.onClick(); redraw();
    assert.equal(loadDraft('cy-1:coffee', storage).name, 'n'.repeat(199), 'a carried answer is cut to the other form\'s limit, never through an emoji');
    entries.clear();
  }
  {
    const lockedPage = await pageWith(marked(['interest', 'coffee']));
    radiosOf(lockedPage)[0].props.onClick();
    let page = redraw();
    walk(page, (n) => n.type?.name === 'SectionForm').props.onBusy(true);
    page = redraw();
    assert.equal(radiosOf(page)[1].props['aria-disabled'], true, 'while a form sends, the choice is locked');
    radiosOf(page)[1].props.onClick();
    page = redraw();
    assert.equal(walk(page, (n) => n.type?.name === 'SectionForm').props.section.key, 'interest', 'and clicks do not switch forms');
    walk(page, (n) => n.type?.name === 'SectionForm').props.onBusy(false);
    entries.clear();
  }
  const oneLeft = await pageWith(marked(['coffee']));
  assert.equal(radiosOf(oneLeft).length, 0, 'one marked form still open needs no choice');
  assert.equal(walk(oneLeft, (n) => n.type?.name === 'SectionForm').props.section.key, 'coffee');
  // A form at its own address: the form alone, or a closed note.
  const mod = await import(pathToFileURL(join(dir, 'src/pages/ApplyOpen.js')));
  const drawCoffee = () => unwrap(mod.ApplyCoffee());
  const expired = open(['coffee']); expired.sections.forEach((section) => { section.available = false; });
  assert.ok(!walk(await pageWith(expired, drawCoffee), (node) => node.type?.name === 'SectionForm'), 'the server cutoff overrides a form open toggle');
  const full = open(['coffee']); full.sections.forEach((section) => { section.available = false; section.full = true; });
  assert.ok(!walk(await pageWith(full, drawCoffee), (node) => node.type?.name === 'SectionForm'), 'full forms cannot be submitted');
  const bareOpen = await pageWith(open(['coffee']), drawCoffee);
  assert.equal(walk(bareOpen, (n) => n.type?.name === 'SectionForm').props.section.key, 'coffee', 'the coffee page draws the coffee form');
  assert.ok(walk(bareOpen, (n) => n.props?.className === 'apply-page__title'), 'the bare page carries the form title');
  assert.ok(!walk(bareOpen, (n) => n.type?.name === 'SiteFooter'), 'a bare page has no footer');
  const later = { ...open(['coffee']), sections: open(['coffee']).sections.concat({ key: 'coffee-2', title: 'Coffee chats, round 2', description: '', open: true, available: true, form: { questions: [{ key: 'name', type: 'short', label: 'Name', required: true }, { key: 'email', type: 'email', label: 'Email', required: true }] } }) };
  globalThis.window.location.search = '?form=coffee-2';
  const byQuery = await pageWith(later);
  assert.equal(walk(byQuery, (n) => n.type?.name === 'SectionForm')?.props.section.key, 'coffee-2', '/apply/?form=<key> draws a form added after the build, alone');
  assert.ok(!walk(byQuery, (n) => n.type?.name === 'SiteFooter'), 'as a bare page');
  globalThis.window.location.search = '';
  assert.equal((await import(pathToFileURL(join(dir, 'src/data/applyForms.js')))).formKeyFromSearch('?form=Bad Key'), '', 'only a plain key is honoured');
  const bareClosed = await pageWith(open(['interest']), drawCoffee);
  assert.ok(!walk(bareClosed, (n) => n.type?.name === 'SectionForm'), 'a closed form draws no fields');
  assert.ok(walk(bareClosed, (n) => Array.isArray(n.props?.children) && n.props.children.some((c) => typeof c === 'string' && c.includes('This form is closed'))), 'a closed form says so');

  // The interest form, mounted alone the way the page mounts it.
  const site = SAMPLE_SITE;
  const Form = walk(twoOpen, (node) => node.type?.name === 'SectionForm').type;
  const render = (props = { section: site.sections[0], cycleId: 'cy-test' }) => {
    cursor = 0; effects = [];
    const tree = Form(props);
    effects.forEach((effect) => effect());
    return tree;
  };
  const byId = (tree, id) => walk(tree, (node) => node.props?.id === id);
  const submit = async (response, props) => {
    globalThis.fetch = async (url, init) => {
      globalThis.lastRequest = { url, body: JSON.parse(init.body) };
      if (response instanceof Error) throw response;
      return response;
    };
    render(props).props.onSubmit({ preventDefault() {} });
    await new Promise((resolve) => setTimeout(resolve, 20));
    return render(props);
  };
  saveDraft('cy-test:interest', draft, storage);
  automaticRequests = 0;
  globalThis.fetch = async () => { automaticRequests++; throw new Error('Unexpected automatic submission'); };
  resetMount();
  let tree = render();
  assert.equal(byId(tree, 'apply-interest-name').props.value, draft.name, 'a reload restores unsent answers');
  assert.equal(byId(tree, 'apply-interest-email').props.value, draft.email);
  assert.equal(automaticRequests, 0, 'restoring a draft never automatically submits it');
  assert.ok(text(tree, 'Not attached: robot.pdf'), 'restored files require reattachment');
  globalThis.lastRequest = null;
  tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) });
  assert.equal(globalThis.lastRequest, null, 'a draft with a missing attachment cannot be silently submitted');
  assert.ok(text(tree, 'Attach robot.pdf again or remove it before sending.'));
  const missingBox = walk(tree, (node) => node.type?.name === 'FileBox');
  const missingControl = missingBox.type(missingBox.props);
  walk(missingControl, (node) => node.props?.['aria-label'] === 'Remove missing robot.pdf').props.onClick();
  delete draft.F_file;

  tree = await submit({ status: 500, ok: false, json: async () => ({ error: 'Temporary outage' }) });
  assert.ok(!tree.props.className.includes('ifz--done'), 'HTTP failures cannot animate success');
  assert.equal(globalThis.lastRequest.url, 'https://wiki.cornellphysicalintelligence.com/api/recruit/site/interest', 'every form posts to its own recruit route');
  assert.equal(globalThis.lastRequest.body.answers.year, 'Freshman');
  assert.deepEqual(globalThis.lastRequest.body.files, {}, 'no file attached, no file sent');
  assert.equal(loadDraft('cy-test:interest', storage).project, draft.project, 'failed attempts keep the durable draft');
  assert.ok(text(tree, 'You can also email cuphysint@cornell.edu'), 'the existing email fallback remains');
  resetMount();
  assert.equal(byId(render(), 'apply-interest-name').props.value, draft.name, 'failed answers survive another reload');

  for (const response of [
    new Error('Network offline'),
    { status: 200, ok: true, json: async () => ({ ok: true }) },
    { status: 200, ok: true, json: async () => ({ ok: true, receipt: 'invalid' }) },
    { status: 409, ok: false, json: async () => ({ code: 'SUBMISSION_SUPERSEDED', error: 'A newer submission was saved.' }) },
    { status: 200, ok: true, json: async () => { throw new Error('HTML instead of JSON'); } },
    { status: 200, ok: true, json: async () => ({}) },
  ]) {
    tree = await submit(response);
    assert.ok(!tree.props.className.includes('ifz--done'));
    assert.equal(loadDraft('cy-test:interest', storage).email, draft.email);
  }
  tree = await submit({ status: 409, ok: false, json: async () => ({ exists: true, submitted: 1 }) });
  assert.ok(!walk(tree, (node) => node.props?.role === 'alertdialog'), 'even legacy duplicate responses never offer unverified replacement');
  assert.ok(loadDraft('cy-test:interest', storage), 'duplicate responses retain answers');
  resetMount();
  tree = await submit({ status: 409, ok: false, json: async () => ({ exists: true, replaceable: false, error: 'You already sent this form with this email.' }) });
  assert.ok(!walk(tree, (node) => node.props?.role === 'alertdialog'), 'a form that never replaces does not offer to');
  assert.ok(text(tree, 'You already sent this form with this email.'), 'it says so instead');

  for (const status of [200, 202]) {
    saveDraft('cy-test:interest', draft, storage);
    resetMount();
    tree = await submit({ status, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01', ...(status === 202 ? { queued: true } : {}) }) });
    assert.ok(tree.props.className.includes('ifz--done'), 'normal success and a confirmed durable receipt keep the success animation');
    assert.equal(storage.getItem(KEY), null, 'only confirmed success clears the submitted draft');
  }
  resetMount();
  assert.equal(byId(render(), 'apply-interest-name').props.value, '', 'completed submissions do not return as drafts');

  // With a receiving cycle, every form posts to its own route with answers
  // keyed by question; a required choice left blank never leaves the page.
  const withCycle = { section: site.sections[0], cycleId: 'cy-test' };
  saveDraft('cy-test:interest', { ...draft, year: '' }, storage);
  resetMount();
  globalThis.lastRequest = null;
  tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) }, withCycle);
  assert.equal(globalThis.lastRequest, null, 'a missing required year is caught before any request');
  assert.ok(text(tree, 'Choose an option for Year.'));
  saveDraft('cy-test:interest', draft, storage);
  resetMount();
  tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) }, withCycle);
  assert.equal(globalThis.lastRequest.url, 'https://wiki.cornellphysicalintelligence.com/api/recruit/site/interest');
  assert.deepEqual(Object.keys(globalThis.lastRequest.body).sort(), ['answers', 'files', 'hp_8c1f'], 'the spam trap has a name no autofill tool fills');
  assert.equal(globalThis.lastRequest.body.answers.project, draft.project);
  assert.ok(tree.props.className.includes('ifz--done'));
  // Exercise the actual upload control and submit handler for both supported
  // attachment question types, including a retry after a network failure.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  globalThis.FileReader = class {
    readAsDataURL(file) {
      this.result = `data:${file.type};base64,${file.bytes.toString('base64')}`;
      queueMicrotask(() => this.onload());
    }
  };
  for (const type of ['file', 'longfile']) {
    const section = { key: 'image-test', title: 'Image test', open: true, form: { questions: [
      { key: 'name', type: 'short', required: true }, { key: 'email', type: 'email', required: true },
      { key: 'photo', type, label: 'Photo', required: true },
    ] } };
    const props = { section, cycleId: 'cy-test' };
    saveDraft('cy-test:image-test', { name: 'Synthetic Image Test', email: 'image@example.test' }, storage);
    resetMount();
    tree = render(props);
    const box = walk(tree, (node) => node.type?.name === 'FileBox');
    const control = box.type(box.props);
    const input = walk(control, (node) => node.type === 'input' && node.props.type === 'file');
    input.props.onChange({ target: { files: [{ name: 'robot.png', type: 'image/png', size: png.length, bytes: png }], value: 'robot.png' } });
    tree = await submit(new Error('Network offline'), props);
    assert.ok(!tree.props.className.includes('ifz--done'));
    assert.deepEqual(globalThis.lastRequest.body.files.photo, { name: 'robot.png', type: 'image/png', data: png.toString('base64') });
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) }, props);
    assert.deepEqual(globalThis.lastRequest.body.files.photo, { name: 'robot.png', type: 'image/png', data: png.toString('base64') }, 'retry retains the selected image');
    assert.ok(tree.props.className.includes('ifz--done'));
  }
  console.log('PASS: PNG file selection, base64 request bytes, and network retry for file and longfile questions');
  for (const rejected of [
    { name: 'phone.heic', type: 'image/heic', size: 100 },
    { name: 'large.png', type: 'image/png', size: 3 * 1024 * 1024 },
    { name: 'empty.png', type: 'image/png', size: 0 },
  ]) {
    const section = { key: 'reject-test', title: 'Upload test', open: true, form: { questions: [
      { key: 'name', type: 'short', required: true }, { key: 'email', type: 'email', required: true },
      { key: 'photo', type: 'file', label: 'Photo', required: false },
    ] } };
    const props = { section, cycleId: 'cy-test' };
    saveDraft('cy-test:reject-test', { name: 'Test', email: 'image@example.test' }, storage);
    resetMount();
    tree = render(props);
    const box = walk(tree, (node) => node.type?.name === 'FileBox');
    const input = walk(box.type(box.props), (node) => node.type === 'input' && node.props.type === 'file');
    input.props.onChange({ target: { files: [rejected], value: rejected.name } });
    globalThis.lastRequest = null;
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) }, props);
    assert.equal(globalThis.lastRequest, null, 'a rejected optional image blocks the submission');
    assert.ok(!tree.props.className.includes('ifz--done'));
    resetMount();
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) }, props);
    assert.equal(globalThis.lastRequest, null, 'a reload retains the unresolved attachment');
    const restoredBox = walk(tree, (node) => node.type?.name === 'FileBox');
    walk(restoredBox.type(restoredBox.props), (node) => node.props?.['aria-label'] === `Remove missing ${rejected.name}`).props.onClick();
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) }, props);
    assert.deepEqual(globalThis.lastRequest.body.files, {}, 'explicit removal permits a submission without the optional file');
    assert.ok(tree.props.className.includes('ifz--done'));
  }
  console.log('PASS: unsupported, oversized, empty, and restored missing files block submission until explicitly resolved');
  for (const failure of ['empty', 'abort']) {
    saveDraft('cy-test:interest', draft, storage);
    resetMount();
    tree = render();
    walk(tree, (node) => node.type?.name === 'FileBox').props.onFile({ name: 'unreadable.png', type: 'image/png', size: png.length, bytes: png });
    globalThis.FileReader = class {
      readAsDataURL() {
        queueMicrotask(() => { if (failure === 'abort') this.onabort(); else { this.result = 'data:image/png;base64,'; this.onload(); } });
      }
    };
    globalThis.lastRequest = null;
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) });
    assert.equal(globalThis.lastRequest, null, 'an unreadable image never sends a partial submission');
    assert.ok(!tree.props.className.includes('ifz--done'));
    assert.equal(loadDraft('cy-test:interest', storage).F_file, 'unreadable.png');
  }
  console.log('PASS: empty or interrupted file reads retain the draft and never send a partial submission');
  // A changed or removed question must not silently discard its pending upload.
  for (const type of [null, 'short']) {
    const section = structuredClone(site.sections[0]);
    section.form.questions = section.form.questions.filter(q => q.key !== 'file');
    if (type) section.form.questions.push({ key: 'file', type, label: 'Changed question' });
    const props = { section, cycleId: 'cy-test' };
    saveDraft('cy-test:interest', { ...draft, F_file: 'pending.png' }, storage);
    resetMount();
    tree = render(props);
    assert.equal(loadDraft('cy-test:interest', storage).F_file, 'pending.png');
    globalThis.lastRequest = null;
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) }, props);
    assert.equal(globalThis.lastRequest, null);
    assert.ok(!tree.props.className.includes('ifz--done'));
    walk(tree, n => n.props?.['aria-label'] === 'Remove missing pending.png').props.onClick();
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) }, props);
    assert.ok(tree.props.className.includes('ifz--done'));
  }
  saveDraft('cy-test:interest', draft, storage);
  resetMount();
  tree = render();
  const dropBox = walk(tree, n => n.type?.name === 'FileBox');
  dropBox.type(dropBox.props).props.onDrop({ preventDefault() {}, dataTransfer: { files: [
    {name: 'first.png', type: 'image/png', size: 68}, {name: 'second.png', type: 'image/png', size: 68},
  ] } });
  globalThis.lastRequest = null;
  tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true }) });
  assert.equal(globalThis.lastRequest, null, 'multiple dropped files never silently send only the first');
  assert.match(loadDraft('cy-test:interest', storage).F_file, /first.png, second.png/);
  // Sending retries a dropped or failing request before it gives up, and a
  // stalled one times out instead of hanging.
  {
    const ok = { status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) };
    const sequence = async (responses) => {
      let n = 0;
      globalThis.fetch = (url, init) => {
        const next = responses[Math.min(n, responses.length - 1)]; n += 1;
        globalThis.lastRequest = { url, body: JSON.parse(init.body) };
        if (next === 'hang') return new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
        return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
      };
      saveDraft('cy-test:interest', draft, storage);
      resetMount();
      render().props.onSubmit({ preventDefault() {} });
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { tree: render(), calls: n };
    };
    let r = await sequence([{ status: 503, ok: false, json: async () => ({ error: 'Busy' }) }, ok]);
    assert.ok(r.tree.props.className.includes('ifz--done'), 'a busy server is tried again and the answer lands');
    assert.equal(r.calls, 2);
    const exists = (submittedAgoMs) => ({ status: 409, ok: false, json: async () => ({ exists: true, replaceable: false, submitted: Date.now() - submittedAgoMs, receipt: `jr-${Date.now()}-abcdef0123456789abcdef01`, error: 'A submission already exists for this email. To correct it, email cuphysint@cornell.edu.' }) });
    r = await sequence([new Error('Network offline'), exists(50)]);
    assert.ok(r.tree.props.className.includes('ifz--done'), 'after a try that got no answer, "already sent" for a submission made just now means it landed');
    r = await sequence([new Error('Network offline'), exists(3 * 86400000)]);
    assert.ok(!r.tree.props.className.includes('ifz--done'), 'a submission from days ago is not this one: still an error');
    assert.ok(text(r.tree, 'A submission already exists'));
    assert.equal(loadDraft('cy-test:interest', storage).email, draft.email, 'and the corrected answers stay');
    r = await sequence([{ status: 429, ok: false, json: async () => ({ error: 'Too many requests' }) }, exists(50)]);
    assert.ok(!r.tree.props.className.includes('ifz--done'), 'a 429 took nothing, so a following "already sent" is an older one');
    r = await sequence([new Error('Network offline'), { status: 409, ok: false, json: async () => ({ error: 'The deadline has passed. This cycle is closed.' }) }]);
    assert.ok(text(r.tree, 'We could not confirm whether your earlier try went through'), 'a refusal after an unanswered try does not claim it failed');
    r = await sequence([{ status: 200, ok: true, json: async () => { throw new Error('cut off'); } }, ok]);
    assert.ok(r.tree.props.className.includes('ifz--done'), 'an unreadable answer is tried again');
    assert.equal(r.calls, 2);
    r = await sequence([{ status: 409, ok: false, json: async () => ({ exists: true, replaceable: false, error: 'A submission already exists for this email.' }) }]);
    assert.ok(!r.tree.props.className.includes('ifz--done'), 'on a first try it is still an error');
    r = await sequence(['hang']);
    assert.equal(r.calls, 3, 'a stalled request times out and is tried twice more');
    assert.ok(text(r.tree, 'The connection dropped'), 'then the visitor is told');
    const mail = walk(r.tree, (n) => n.props?.className === 'ifz-mailto');
    assert.ok(mail, 'and can email the answers instead');
    const body = decodeURIComponent(mail.props.href.split('body=')[1]);
    assert.match(mail.props.href, /^mailto:cuphysint@cornell\.edu\?subject=/);
    assert.ok(body.includes(draft.project) && body.includes(draft.email), 'with every answer');
    assert.equal(loadDraft('cy-test:interest', storage).email, draft.email, 'and the draft stays');
    r = await sequence([{ status: 500, ok: false, json: async () => ({ error: 'Down' }) }]);
    assert.equal(r.calls, 3, 'server errors are tried three times in all');
  }
  console.log('PASS: the feed and every submission retry dropped or failing requests, a stalled send times out, a landed retry counts, and failures offer the answers by email');

  // Two submits in the same render must issue only one request.
  saveDraft('cy-test:interest', draft, storage);
  resetMount();
  tree = render();
  let finish, calls = 0;
  globalThis.fetch = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  tree.props.onSubmit({ preventDefault() {} });
  tree.props.onSubmit({ preventDefault() {} });
  assert.equal(calls, 1);
  assert.equal(walk(render(), n => n.props?.className === 'ifz-away').props.inert, true);
  finish({ status: 400, ok: false, json: async () => ({ error: 'Bad request' }) });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(walk(render(), n => n.props?.className === 'ifz-away').props.inert, undefined);
  tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'jr-1790000000000-abcdef0123456789abcdef01' }) });
  assert.ok(tree.props.className.includes('ifz--done'), 'the in-flight guard releases after failure');
  console.log('PASS: changed forms retain pending attachments, multiple-file drops block, and concurrent submits cannot race');

  console.log('PASS: form reload/failure recovery, file reminder, draft expiry, per-form storage, duplicate confirmation, verified success receipt, wiki-driven page and routes.');
} finally {
  globalThis.window = previousWindow;
  globalThis.fetch = previousFetch;
  globalThis.document = previousDocument;
  if (previousFileReader === undefined) delete globalThis.FileReader;
  else globalThis.FileReader = previousFileReader;
  delete globalThis.formHooks;
  delete globalThis.lastRequest;
  await rm(dir, { recursive: true, force: true });
}
