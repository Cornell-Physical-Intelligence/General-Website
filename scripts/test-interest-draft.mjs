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
    .replace('import.meta.env.DEV', 'false');
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
    await new Promise((resolve) => setImmediate(resolve));
    cursor = 0; effects = [];
    return draw();
  };
  const downPage = await pageWith(new Error('wiki unreachable'));
  assert.ok(!walk(downPage, (node) => node.type?.name === 'SectionForm'), 'an unreachable wiki shows no form that could not be sent');
  assert.ok(text(downPage, 'We could not load the form right now'), 'it says so and gives the email');
  const open = (keys, landing = null) => ({ cycle: { id: 'cy-1', name: 'Fall 2026', term: 'Fall 2026', status: 'open' }, landing, sections: SAMPLE_SITE.sections.concat({ key: 'coffee', title: 'Coffee chats', description: '', open: true, form: { questions: [{ key: 'name', type: 'short', label: 'Name', required: true }, { key: 'email', type: 'email', label: 'Email', required: true }] } }).map((s) => ({ ...s, open: keys.includes(s.key) })) });
  const twoOpen = await pageWith(open(['interest', 'coffee']));
  assert.equal(walk(twoOpen, (node) => node.type?.name === 'SectionForm').props.section.key, 'interest', 'with no choice, /apply shows the first open form');
  assert.equal(walk(await pageWith(open(['interest', 'coffee'], 'coffee')), (node) => node.type?.name === 'SectionForm').props.section.key, 'coffee', '/apply shows the form the wiki marks for it');
  assert.equal(walk(await pageWith(open(['interest'], 'coffee')), (node) => node.type?.name === 'SectionForm').props.section.key, 'interest', 'a closed choice falls back to the first open form');
  assert.equal((await pageWith(open([]))).type, 'closed', 'nothing open shows the closed page');
  // A form at its own address: the form alone, or a closed note.
  const mod = await import(pathToFileURL(join(dir, 'src/pages/ApplyOpen.js')));
  const drawCoffee = () => unwrap(mod.ApplyCoffee());
  const bareOpen = await pageWith(open(['coffee']), drawCoffee);
  assert.equal(walk(bareOpen, (n) => n.type?.name === 'SectionForm').props.section.key, 'coffee', 'the coffee page draws the coffee form');
  assert.ok(walk(bareOpen, (n) => n.props?.className === 'apply-page__title'), 'the bare page carries the form title');
  assert.ok(!walk(bareOpen, (n) => n.type?.name === 'SiteFooter'), 'a bare page has no footer');
  const later = { ...open(['coffee']), sections: open(['coffee']).sections.concat({ key: 'coffee-2', title: 'Coffee chats, round 2', description: '', open: true, form: { questions: [{ key: 'name', type: 'short', label: 'Name', required: true }, { key: 'email', type: 'email', label: 'Email', required: true }] } }) };
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
    await new Promise((resolve) => setImmediate(resolve));
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
  tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true }) });
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
    { status: 200, ok: true, json: async () => { throw new Error('HTML instead of JSON'); } },
    { status: 200, ok: true, json: async () => ({}) },
  ]) {
    tree = await submit(response);
    assert.ok(!tree.props.className.includes('ifz--done'));
    assert.equal(loadDraft('cy-test:interest', storage).email, draft.email);
  }
  tree = await submit({ status: 409, ok: false, json: async () => ({ exists: true, submitted: 1 }) });
  assert.ok(walk(tree, (node) => node.props?.role === 'alertdialog'), 'duplicates still ask before replacing');
  assert.ok(loadDraft('cy-test:interest', storage), 'duplicate responses retain answers');
  resetMount();
  tree = await submit({ status: 409, ok: false, json: async () => ({ exists: true, replaceable: false, error: 'You already sent this form with this email.' }) });
  assert.ok(!walk(tree, (node) => node.props?.role === 'alertdialog'), 'a form that never replaces does not offer to');
  assert.ok(text(tree, 'You already sent this form with this email.'), 'it says so instead');

  for (const status of [200, 202]) {
    saveDraft('cy-test:interest', draft, storage);
    resetMount();
    tree = await submit({ status, ok: true, json: async () => ({ ok: true, ...(status === 202 ? { queued: true } : {}) }) });
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
  tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true }) }, withCycle);
  assert.equal(globalThis.lastRequest, null, 'a missing required year is caught before any request');
  assert.ok(text(tree, 'Choose an option for Year.'));
  saveDraft('cy-test:interest', draft, storage);
  resetMount();
  tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true }) }, withCycle);
  assert.equal(globalThis.lastRequest.url, 'https://wiki.cornellphysicalintelligence.com/api/recruit/site/interest');
  assert.deepEqual(Object.keys(globalThis.lastRequest.body).sort(), ['answers', 'files', 'website']);
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
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true, receipt: 'synthetic' }) }, props);
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
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true }) }, props);
    assert.equal(globalThis.lastRequest, null, 'a rejected optional image blocks the submission');
    assert.ok(!tree.props.className.includes('ifz--done'));
    resetMount();
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true }) }, props);
    assert.equal(globalThis.lastRequest, null, 'a reload retains the unresolved attachment');
    const restoredBox = walk(tree, (node) => node.type?.name === 'FileBox');
    walk(restoredBox.type(restoredBox.props), (node) => node.props?.['aria-label'] === `Remove missing ${rejected.name}`).props.onClick();
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true }) }, props);
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
    tree = await submit({ status: 200, ok: true, json: async () => ({ ok: true }) });
    assert.equal(globalThis.lastRequest, null, 'an unreadable image never sends a partial submission');
    assert.ok(!tree.props.className.includes('ifz--done'));
    assert.equal(loadDraft('cy-test:interest', storage).F_file, 'unreadable.png');
  }
  console.log('PASS: empty or interrupted file reads retain the draft and never send a partial submission');
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
