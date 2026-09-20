// What the Apply page shows when the wiki cannot be reached: the interest
// form exactly as the wiki publishes it by default. Mirrors
// `lib/recruit/sections.js` in the wiki repo; the live shape comes from
// GET /api/recruit/site and wins whenever it loads.
export const SUBTEAMS = ['Mechanical', 'Electrical', 'Software', 'Creative', 'Business & Marketing'];
export const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'];
export const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
export const MAX_FILE_BYTES = 2.5 * 1024 * 1024;

export const FALLBACK_SITE = {
  cycle: null,
  sections: [
    {
      key: 'interest',
      title: 'Interest form',
      description: 'Fill in the information below to display interest in applying to CUPI.',
      open: true,
      form: {
        questions: [
          { key: 'name', type: 'short', label: 'Name', required: true, max: 100 },
          { key: 'email', type: 'email', label: 'Email', required: true, max: 200 },
          { key: 'subteam', type: 'single', label: 'Subteam of interest', required: false, options: SUBTEAMS },
          { key: 'year', type: 'single', label: 'Year', required: true, options: YEARS },
          { key: 'project', type: 'long', label: "What's the coolest project you've done?", required: false, help: 'Tell us about it, or drop a photo or PDF right here...', max: 1000 },
          { key: 'file', type: 'file', label: 'Photo or PDF of it', required: false, accept: FILE_TYPES, maxBytes: MAX_FILE_BYTES },
        ],
      },
    },
  ],
};
