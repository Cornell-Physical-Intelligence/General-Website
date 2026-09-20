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
cycle is receiving the website and which of its three forms are open (the
interest form, coffee chats, the application), then draws each open form from
its question list: short and long text, email, one choice, several choices, a
checkbox, a link, a file. Titles, descriptions, questions, and the open flags
are edited in the wiki under Applications → the cycle → Settings → Website
sections, and the site follows on its next load. With more than one form open
the page shows a row of their names; `/apply/?form=coffee` opens one directly.
When no form is open, the page renders `ApplyClosed.jsx` (the crab and the
closed note). Each form also has a page of its own with nothing but that form
on it, no menu and no footer: `/apply/interest/`, `/apply/coffee/`, and
`/apply/application/` (the `applyInterest`, `applyCoffee`, and
`applyApplication` entries in `src/seo.js`, marked `bare`, rendered from the
apply chunk). A closed form's page says so and links to `/apply/`.

- Submissions post to `POST /api/recruit/site/<form>` as
  `{ answers, files, website, confirmUpdate }`. Before the wiki has a cycle
  receiving the website, the interest form still posts its flat body to
  `POST /api/interest`. Both answer 409 `{ exists: true }` when that email
  already sent the form, and the page asks before replacing.
- `src/data/applyForms.js` is the fallback when the wiki cannot be reached:
  the interest form as the wiki publishes it by default. Keep it in step with
  `lib/recruit/sections.js` in the wiki repo.
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
