// What the apply pages share about the wiki's forms: the file rules the
// renderer falls back to, and the shape of a form key. The forms themselves
// come from GET /api/recruit/site on every load; nothing is mirrored here.
export const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
export const MAX_FILE_BYTES = 2.5 * 1024 * 1024;
export const FORM_KEY = /^[a-z][a-z0-9_-]{0,39}$/;

// A form the wiki added later has no page of its own in the build, so its
// address, /apply/<key>/, lands on /apply/?form=<key>: the same bare page.
export const formKeyFromSearch = (search) => {
  try {
    const key = new URLSearchParams(search || '').get('form') || '';
    return FORM_KEY.test(key) ? key : '';
  } catch {
    return '';
  }
};
