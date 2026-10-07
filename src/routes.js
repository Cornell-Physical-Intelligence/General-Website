// Routing, kept apart from App so that main.jsx can read the current route and start
// fetching its page before React exists. Paths come from the SEO map so emitted static
// documents, client routing, canonicals, and the sitemap cannot drift independently.
import { PAGE_SEO, getPageSeo } from './seo';

export const VALID_PAGES = Object.entries(PAGE_SEO)
  .filter(([, seo]) => !seo.noindex)
  .map(([page]) => page);

// Real paths rather than #fragments. The build writes an index.html into a folder per
// route, so /work is a genuine document that Pages can serve and the router reads back
// from the pathname.
export const getPageFromPath = () => {
  const raw = window.location.pathname.replace(/index\.html$/, '') || '/';
  const path = raw === '/' || raw.endsWith('/') ? raw : `${raw}/`;
  return (
    Object.entries(PAGE_SEO).find(
      ([, seo]) => !seo.noindex && seo.path === path,
    )?.[0] ?? 'home'
  );
};

export const writePath = (page, hash = '') => {
  const legacyPage = ['home', 'work', 'members', 'sponsors', 'apply'].includes(page);
  const path = legacyPage ? (page === 'home' ? '/' : `/${page}`) : getPageSeo(page).path;
  window.history.pushState({}, '', hash ? `${path}#${hash}` : path);
};

// Anything still linking to the old #work style URLs is rewritten in place, once, before
// the first render, so those links keep working and no stray fragment is left in the bar.
// A fragment that names a section (/work/#hexapod) is kept: App scrolls to it.
const SECTION_HASH = /^#[a-z][a-z0-9-]*$/;

export const normalizeLegacyHash = () => {
  const legacy = window.location.hash.replace('#', '');
  if (VALID_PAGES.includes(legacy)) {
    window.history.replaceState({}, '', legacy === 'home' ? '/' : `/${legacy}`);
  } else if (window.location.hash && !SECTION_HASH.test(window.location.hash)) {
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
  }
};

// Home is absent on purpose: it ships inside the entry chunk, because it is where most
// visits begin and it is the one page that cannot afford to wait for a second module.
export const PAGE_LOADERS = {
  work: () => import('./pages/Work'),
  members: () => import('./pages/Members'),
  sponsors: () => import('./pages/Sponsors'),
  apply: () => import('./pages/Apply'),
  // The standalone form pages live in the apply chunk, so a deep link to one
  // costs the same single fetch as /apply/ itself.
  applyInterest: () => import('./pages/Apply').then((m) => ({ default: m.ApplyInterest })),
  applyCoffee: () => import('./pages/Apply').then((m) => ({ default: m.ApplyCoffee })),
  applyApplication: () => import('./pages/Apply').then((m) => ({ default: m.ApplyApplication })),
  aboutCupi: () => import('./pages/AboutCupi'),
  faq: () => import('./pages/Faq'),
  vq1Report: () => import('./pages/Vq1Report'),
  racingReport: () => import('./pages/RacingReport'),
};
