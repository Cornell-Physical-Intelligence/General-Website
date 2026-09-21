# Cornell Physical Intelligence (CUPI)

This repository contains the official website for [Cornell Physical Intelligence
(CUPI)](https://cornellphysicalintelligence.com/), a Cornell University student robotics
organization building systems for manipulation, autonomous perception, and navigation.
Cornell lists the organization as the [Cornell Physical Intelligence
Club](https://cornell.campusgroups.com/cupi/home/).

CUPI brings together mechanical, electrical, software, and business students to build
intelligent physical systems. The site documents the team, robotics projects, technical
reports, sponsors, and application information.

## Development

```bash
npm ci
npm run dev
```

Run `npm run build` to create the production site in `docs/`. GitHub Pages serves that
folder from the `main` branch at the canonical domain above.

Useful checks:

```bash
npx eslint src vite.config.js
npm run check
```

`npm run check` is the full gate: lint, build, and the asset, font, and SEO
verifications. CI runs it on every push and also requires the committed `docs/`
build to match a fresh rebuild, so commit the rebuilt `docs/` with any source
change.

## Apply page: what it shows

The Apply page is driven by the wiki. `src/pages/ApplyOpen.jsx` asks
`wiki.cornellphysicalintelligence.com/api/recruit/site` which recruitment
cycle is receiving the website and which of its forms are open (a cycle
starts with an interest form, coffee chats and an application form, and the
team adds or removes forms in the wiki), then draws each open form from
its question list: short and long text, email, one choice, several choices, a
checkbox, a link, a file. Titles, descriptions, questions, the open flags, and
which form `/apply` shows are edited in the wiki under Applications → the
cycle → the form's tab → Form, and the site follows on its next load. `/apply`
(the QR code's address) shows one form: the one marked "Shown at /apply" in
the wiki, else the first open one. When no form is open, the page renders
`ApplyClosed.jsx` (the crab and the closed note). Each form also has a page of its own with nothing but that form
on it, no menu and no footer: `/apply/interest/`, `/apply/coffee/`, and
`/apply/application/` (the `applyInterest`, `applyCoffee`, and
`applyApplication` entries in `src/seo.js`, marked `bare`, rendered from the
apply chunk). A form the wiki adds later has no static document, so its
address `/apply/<key>/` is sent by `404.html` to `/apply/?form=<key>`, which
draws the same bare page. A closed form's page says so and links to `/apply/`.

- Submissions post to `POST /api/recruit/site/<form>` as
  `{ answers, files, website, confirmUpdate }`, which answers 409
  `{ exists: true }` when that email already sent the form; the page asks
  before replacing. When no cycle receives the website the feed lists no
  forms and the page renders the closed view.
- When the wiki cannot be reached the page says so and gives the contact
  email; it never draws a form it could not send. `src/data/applyForms.js`
  holds only the file rules and the shape of a form key.
- Drafts stay in localStorage for seven days, one per form
  (`src/interestDraft.js`); file bytes are never stored, only the file name.
- `APPLY_ACTIVE` in `src/pages/Apply.jsx` is the off switch: `false` renders
  `ApplyClosed.jsx` without asking the wiki.

When the page's wording changes, update the `apply` entry's `description` and
`lastModified` in `src/seo.js`, rebuild, and copy `docs/sitemap.xml` over
`public/sitemap.xml` (the SEO check requires them identical). If the closed
page becomes the usual view again, its crab is the route's largest contentful
paint; the image preload that used to live in `vite.config.js` (see git
history) is worth restoring then.
