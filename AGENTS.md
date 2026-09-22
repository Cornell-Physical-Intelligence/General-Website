# Agent notes for the CUPI website

Read this before changing code. These are the decisions that keep getting
re-litigated; they are settled.

## Do not rewrite finished pages

- **Apply page**: `src/pages/Apply.jsx` loads `ApplyOpen.jsx`, which uses the
  wiki feed to show an open form or `ApplyClosed.jsx` (crab + closed note).
  `ApplyOpen.jsx` draws whatever forms the wiki has open
  from `GET /api/recruit/site`; which forms exist, their questions, and their
  wording are edited in the wiki, never hardcoded here. Do not restyle or
  "improve" either page unprompted. The README section "Apply page: what it
  shows" covers the request and response shapes and the seo.js and sitemap
  steps.
- The forms' backend is the wiki repo (`Cornell-Physical-Intelligence/wiki`):
  `lib/recruit/` behind `/api/recruit/*` (the feed at `/api/recruit/site`,
  submissions at `/api/recruit/site/<form>`). Keep it a component with its own
  tables and routes; never replace it with a third-party form service.

## Gates that must stay green

- `npm run check` before any commit: lint, build, asset/font/SEO verification.
- The committed `docs/` build must equal a fresh rebuild (CI diffs it), and
  `public/sitemap.xml` must equal the generated `docs/sitemap.xml`. Changing
  any `lastModified` in `src/seo.js` means rebuilding and re-syncing both.
- `lastModified` dates record real content changes only; never bump them to
  simulate freshness.

## Conventions

- No em dashes in site copy; write around them.
- Visible presentation changes need Andre's approval first; preview before
  shipping. Nonvisual SEO/perf changes still go through the full gate.
- Favicons: the fetchable icon URLs stay the circular disc (Google's pick);
  the rounded-square tab icon ships only as an inline data URI. Keep that
  pairing exactly.
- SEO copy lives in `src/seo.js` and the document head, not in visible page
  prose. Do not add crawl-oriented text blocks to pages.
- The hero, gallery, and report pipelines were performance-tuned with
  pixel-parity gates (see git history around 2026-08-19). Do not regress
  transfer size or main-thread work for cosmetic refactors.

## SEO content freeze (September 8, 2026)

- SEO work must not change site content on any platform: the main site,
  wiki, CampusGroups, or social/GitHub/YouTube profiles and posts. This also
  prohibits adding, removing, or renaming pages, navigation, and media.
  A separate, explicit user request for a content change is required.
- Report existing content drift instead of silently rewriting or deleting
  it. In particular, `/about-cupi/` and `/faq/` remain live despite their
  removal from navigation; that finding is not permission to change them.
- Fix only demonstrated technical defects within the authorized scope.
  Prove content/output parity, preserve unrelated work, and run the gates
  above. Do not treat a green metadata verifier as proof of visual or
  rendered-content parity.
- Measure Google Web with `pws=0` and `udm=14`, leaving normal duplicate
  filtering enabled. Do not use `filter=0` for the ranking baseline. Record
  location, date, surface, and independent result URLs; do not count
  sitelinks, AI panels, or the owner's Search Console panel as ranks.
- Do not repeat indexing requests or resubmit already healthy sitemaps.
  Never attribute a ranking fluctuation to an action without evidence.
