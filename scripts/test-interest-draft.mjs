// Synthetic answers and a mocked browser/network. Exercise the actual form's
// submit handler without sending an application or reading personal data.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { transformWithOxc } from 'vite';
import { INTEREST_DRAFT_KEY, INTEREST_DRAFT_TTL, loadInterestDraft, saveInterestDraft, clearInterestDraft } from '../src/interestDraft.js';

const entries = new Map();
const storage = {
  getItem: (key) => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
  removeItem: (key) => entries.delete(key),
};
const draft = { name: 'Test Member', email: 'synthetic@example.test', year: 'Freshman', subteam: 'Software', project: 'A synthetic robot', fileName: 'robot.pdf' };
assert.equal(saveInterestDraft({ ...draft, file: { data: 'NEVER STORE FILE BYTES' } }, storage, 100), true);
assert.deepEqual(loadInterestDraft(storage, 101), draft);
assert.ok(!storage.getItem(INTEREST_DRAFT_KEY).includes('NEVER STORE FILE BYTES'));
assert.equal(loadInterestDraft(storage, 100 + INTEREST_DRAFT_TTL), null, 'expired answers are removed');
assert.equal(storage.getItem(INTEREST_DRAFT_KEY), null);
storage.setItem(INTEREST_DRAFT_KEY, '{broken');
assert.equal(loadInterestDraft(storage), null, 'corrupt browser storage does not break the form');
const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Full'); } };
assert.equal(saveInterestDraft(draft, blocked), false);
assert.equal(loadInterestDraft(blocked), null);
assert.doesNotThrow(() => clearInterestDraft(draft, blocked));
saveInterestDraft({ ...draft, project: 'Newer draft in another tab' }, storage);
clearInterestDraft(draft, storage);
assert.equal(loadInterestDraft(storage).project, 'Newer draft in another tab', 'a previous successful request cannot erase newer answers');
entries.clear();

const dir = await mkdtemp(join(tmpdir(), 'cupi-form-test-'));
const previousWindow = globalThis.window;
const previousFetch = globalThis.fetch;
try {
  await mkdir(join(dir, 'src/pages'), { recursive: true });
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
  const source = (await readFile(new URL('../src/pages/ApplyOpen.jsx', import.meta.url), 'utf8'))
    .replace("import SiteFooter from '../components/SiteFooter';", 'const SiteFooter = () => null;')
    .replace("import './Apply.css';", '')
    .replace("from '../interestDraft'", "from '../interestDraft.js'")
    .replace('import.meta.env.DEV', 'false');
  const compiled = await transformWithOxc(source, 'ApplyOpen.jsx', { jsx: { runtime: 'automatic' } });
  await writeFile(join(dir, 'src/pages/ApplyOpen.js'), compiled.code);
  globalThis.window = { localStorage: storage };
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
  const Form = walk(Apply(), (node) => node.type?.name === 'InterestForm').type;
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
  const render = () => {
    cursor = 0; effects = [];
    const tree = Form();
    effects.forEach((effect) => effect());
    return tree;
  };
  const byId = (tree, id) => walk(tree, (node) => node.props?.id === id);
  const submit = async (response) => {
    globalThis.fetch = async () => {
      if (response instanceof Error) throw response;
      return response;
    };
    render().props.onSubmit({ preventDefault() {} });
    await new Promise((resolve) => setImmediate(resolve));
    return render();
  };
  saveInterestDraft(draft, storage);
  resetMount();
  let tree = render();
  assert.equal(byId(tree, 'interest-name').props.value, draft.name, 'a reload restores unsent answers');
  assert.equal(byId(tree, 'interest-email').props.value, draft.email);
  assert.equal(automaticRequests, 0, 'restoring a draft never automatically submits it');
  assert.ok(walk(tree, (node) => typeof node.props?.children === 'string' && node.props.children.includes('Attach robot.pdf again')), 'restored files require reattachment');

  tree = await submit({ status: 500, ok: false, json: async () => ({ error: 'Temporary outage' }) });
  assert.ok(!tree.props.className.includes('ifz--done'), 'HTTP failures cannot animate success');
  assert.equal(loadInterestDraft(storage).project, draft.project, 'failed attempts keep the durable draft');
  assert.ok(walk(tree, (node) => typeof node.props?.children === 'string' && node.props.children.includes('You can also email cuphysint@cornell.edu')), 'the existing email fallback remains');
  resetMount();
  assert.equal(byId(render(), 'interest-name').props.value, draft.name, 'failed answers survive another reload');

  for (const response of [
    new Error('Network offline'),
    { status: 200, ok: true, json: async () => { throw new Error('HTML instead of JSON'); } },
    { status: 200, ok: true, json: async () => ({}) },
  ]) {
    tree = await submit(response);
    assert.ok(!tree.props.className.includes('ifz--done'));
    assert.equal(loadInterestDraft(storage).email, draft.email);
  }
  tree = await submit({ status: 409, ok: false, json: async () => ({ exists: true, submitted: 1 }) });
  assert.ok(walk(tree, (node) => node.props?.role === 'alertdialog'), 'duplicates still ask before replacing');
  assert.ok(loadInterestDraft(storage), 'duplicate responses retain answers');

  for (const status of [200, 202]) {
    saveInterestDraft(draft, storage);
    resetMount();
    tree = await submit({ status, ok: true, json: async () => ({ ok: true, ...(status === 202 ? { queued: true } : {}) }) });
    assert.ok(tree.props.className.includes('ifz--done'), 'normal success and a confirmed durable receipt keep the success animation');
    assert.equal(storage.getItem(INTEREST_DRAFT_KEY), null, 'only confirmed success clears the submitted draft');
  }
  resetMount();
  assert.equal(byId(render(), 'interest-name').props.value, '', 'completed submissions do not return as drafts');
  console.log('PASS: form reload/failure recovery, file reminder, draft expiry, storage failures, duplicate confirmation and verified success receipt.');
} finally {
  globalThis.window = previousWindow;
  globalThis.fetch = previousFetch;
  delete globalThis.formHooks;
  await rm(dir, { recursive: true, force: true });
}
