// Unsent answers stay on this browser for seven days. File bytes are never
// copied into localStorage; only the name is retained as a reattachment cue.
export const INTEREST_DRAFT_KEY = 'cupi:interest-draft:v1';
export const INTEREST_DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;

const browserStorage = () => {
  try { return window.localStorage; } catch { return null; }
};
const fields = (draft) => Object.fromEntries(Object.entries({
  name: 100, email: 200, subteam: 80, year: 30, project: 1000, fileName: 200,
}).map(([key, limit]) => [key, typeof draft?.[key] === 'string' ? draft[key].slice(0, limit) : '']));

export function loadInterestDraft(storage = browserStorage(), now = Date.now()) {
  try {
    const saved = JSON.parse(storage?.getItem(INTEREST_DRAFT_KEY) || 'null');
    if (!saved) return null;
    if (saved.version !== 1 || !Number.isFinite(saved.savedAt)
      || saved.savedAt > now || now - saved.savedAt >= INTEREST_DRAFT_TTL) {
      storage.removeItem(INTEREST_DRAFT_KEY);
      return null;
    }
    return fields(saved.fields);
  } catch { return null; }
}

export function saveInterestDraft(draft, storage = browserStorage(), now = Date.now()) {
  try {
    if (!storage) return false;
    const clean = fields(draft);
    if (Object.values(clean).some(Boolean)) {
      storage.setItem(INTEREST_DRAFT_KEY, JSON.stringify({ version: 1, savedAt: now, fields: clean }));
    } else {
      storage.removeItem(INTEREST_DRAFT_KEY);
    }
    return true;
  } catch { return false; }
}

export function clearInterestDraft(submitted, storage = browserStorage()) {
  try {
    const saved = JSON.parse(storage?.getItem(INTEREST_DRAFT_KEY) || 'null');
    // A successful response for this form must not erase newer answers saved
    // while it was sending, including answers entered in another tab.
    if (saved && JSON.stringify(fields(saved.fields)) === JSON.stringify(fields(submitted))) {
      storage.removeItem(INTEREST_DRAFT_KEY);
    }
  } catch { /* Private browsing or a full storage area must not block success. */ }
}
