// Unsent answers stay on this browser for seven days, one draft per form
// (cycle and section). File bytes are never copied into localStorage; only
// the name is retained as a reattachment cue under `F_<question key>`.
export const DRAFT_PREFIX = 'cupi:form-draft:v2:';
export const INTEREST_DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;
const LEGACY_KEY = 'cupi:interest-draft:v1';

const browserStorage = () => {
  try { return window.localStorage; } catch { return null; }
};
const keyFor = (form) => DRAFT_PREFIX + String(form || 'interest');
const clean = (values) => {
  const out = {};
  for (const [k, v] of Object.entries(values || {})) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(k)) continue;
    if (typeof v === 'string') { if (v) out[k] = v.slice(0, 2000); }
    else if (Array.isArray(v)) { const list = v.filter((x) => typeof x === 'string').slice(0, 40); if (list.length) out[k] = list; }
    else if (v === true) out[k] = true;
  }
  return out;
};

export function loadDraft(form, storage = browserStorage(), now = Date.now()) {
  try {
    const saved = JSON.parse(storage?.getItem(keyFor(form)) || 'null');
    if (!saved) return null;
    if (saved.version !== 2 || !Number.isFinite(saved.savedAt) || saved.savedAt > now || now - saved.savedAt >= INTEREST_DRAFT_TTL) {
      storage.removeItem(keyFor(form));
      return null;
    }
    return clean(saved.values);
  } catch { return null; }
}

export function saveDraft(form, values, storage = browserStorage(), now = Date.now()) {
  try {
    if (!storage) return false;
    const next = clean(values);
    if (Object.keys(next).length) storage.setItem(keyFor(form), JSON.stringify({ version: 2, savedAt: now, values: next }));
    else storage.removeItem(keyFor(form));
    return true;
  } catch { return false; }
}

export function clearDraft(form, submitted, storage = browserStorage()) {
  try {
    const saved = JSON.parse(storage?.getItem(keyFor(form)) || 'null');
    // A successful response for this form must not erase newer answers saved
    // while it was sending, including answers entered in another tab.
    if (saved && JSON.stringify(clean(saved.values)) === JSON.stringify(clean(submitted))) storage.removeItem(keyFor(form));
    if (form === 'interest') storage?.removeItem(LEGACY_KEY);
  } catch { /* Private browsing or a full storage area must not block success. */ }
}

// The interest form kept its answers under the old key; carry them over once.
export function loadLegacyInterestDraft(storage = browserStorage(), now = Date.now()) {
  try {
    const saved = JSON.parse(storage?.getItem(LEGACY_KEY) || 'null');
    if (!saved || saved.version !== 1 || !Number.isFinite(saved.savedAt) || now - saved.savedAt >= INTEREST_DRAFT_TTL) return null;
    const f = saved.fields || {};
    return clean({ name: f.name, email: f.email, subteam: f.subteam, year: f.year, project: f.project, F_file: f.fileName });
  } catch { return null; }
}
