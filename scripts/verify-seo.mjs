import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  ORGANIZATION_DESCRIPTION,
  ORGANIZATION_SAME_AS,
  PAGE_SEO,
  SITE_ALTERNATE_NAMES,
  SITE_URL,
  canonicalUrlForPage,
} from '../src/seoBuild.js';

const INDEXABLE_PAGES = Object.entries(PAGE_SEO).filter(([, seo]) => !seo.noindex);

const INLINE_TAB_ICON_PATTERN =
  /<link rel="icon" type="image\/png" sizes="32x32" href="(data:image\/png;base64,[^"]+)" \/>/;

const fileForPage = (seo) =>
  seo.path === '/'
    ? 'docs/index.html'
    : join('docs', seo.path.replace(/^\/+|\/+$/g, ''), 'index.html');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const capture = (html, pattern, label) => {
  const value = html.match(pattern)?.[1];
  assert(value, `Missing ${label}`);
  return value;
};

const count = (html, pattern) => (html.match(pattern) ?? []).length;

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const runtimeFooter = readFileSync('src/components/SiteFooter.jsx', 'utf8');
const runtimeApp = readFileSync('src/App.jsx', 'utf8');
const runtimeNavItems = capture(
  runtimeApp,
  /const NAV_ITEMS = \[([\s\S]*?)\];/,
  'runtime navigation items',
);
const runtimeNavLabels = [...runtimeNavItems.matchAll(/label: '([^']+)'/g)].map(
  (match) => match[1],
);
assert(
  JSON.stringify(runtimeNavLabels) ===
    JSON.stringify(['Home', 'Work', 'Members', 'Sponsors', 'Apply']),
  'SEO changes must preserve the original five-item visible navigation',
);
assert(
  /<div(?=[^>]*className="site-footer__copy")(?=[^>]*data-nosnippet="")[^>]*>/.test(
    runtimeFooter,
  ),
  'The rendered footer boilerplate must be excluded from search snippets',
);
assert(
  runtimeFooter.includes('CUPI is a registered student organization of Cornell University.'),
  'SEO changes must preserve the original visible footer wording',
);
assert(
  !runtimeFooter.includes('href="/about-cupi/"') && !runtimeFooter.includes('href="/faq/"'),
  'SEO-only pages must not add links to the visible footer',
);

const faviconPath = 'public/favicon-cupi.png';
const favicon = await sharp(faviconPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
assert(
  favicon.info.width === 192 && favicon.info.height === 192,
  'The declared favicon must remain a square 192px search-result asset',
);
const faviconAlpha = (x, y) => favicon.data[(y * favicon.info.width + x) * 4 + 3];
assert(
  faviconAlpha(0, 0) === 0 &&
    faviconAlpha(20, 20) === 0 &&
    faviconAlpha(96, 0) > 0 &&
    faviconAlpha(0, 96) > 0 &&
    faviconAlpha(96, 96) === 255,
  'The declared favicon must retain a circular alpha silhouette',
);
const legacyPngFavicon = await sharp('public/favicon-32.png')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const legacyPngAlpha = (x, y) =>
  legacyPngFavicon.data[(y * legacyPngFavicon.info.width + x) * 4 + 3];
assert(
  legacyPngFavicon.info.width === 32 &&
    legacyPngFavicon.info.height === 32 &&
    legacyPngAlpha(0, 0) === 0 &&
    legacyPngAlpha(3, 3) === 0 &&
    legacyPngAlpha(16, 0) > 0 &&
    legacyPngAlpha(16, 16) === 255,
  'The legacy 32px favicon URL must also retain a circular alpha silhouette',
);
const legacySvgFavicon = readFileSync('public/favicon.svg', 'utf8');
assert(
  legacySvgFavicon.includes('<circle cx="500" cy="500" r="500"/>') &&
    !legacySvgFavicon.includes('<rect '),
  'The legacy SVG favicon URL must also use the circular silhouette',
);
for (const faviconFile of [
  'favicon-32.png',
  'favicon-192.png',
  'favicon-cupi.png',
  'favicon.svg',
]) {
  assert(
    readFileSync(join('public', faviconFile)).equals(readFileSync(join('docs', faviconFile))),
    `${faviconFile} must be synchronized between the source and deployed build`,
  );
}

// The tab favicon is the rounded square, shipped only as an inline data URI so no
// crawler can fetch it and re-adopt it for result pages: search must keep the disc.
const sourceHead = readFileSync('index.html', 'utf8');
const inlineTabIcon = capture(
  sourceHead,
  INLINE_TAB_ICON_PATTERN,
  'inline squircle tab favicon in index.html',
);
const inlineTabIconLink = `<link rel="icon" type="image/png" sizes="32x32" href="${inlineTabIcon}" />`;
const tabIcon = await sharp(
  Buffer.from(inlineTabIcon.slice('data:image/png;base64,'.length), 'base64'),
)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
assert(
  tabIcon.info.width === 32 && tabIcon.info.height === 32,
  'The inline tab favicon must remain a 32px bitmap',
);
const tabIconAlpha = (x, y) => tabIcon.data[(y * tabIcon.info.width + x) * 4 + 3];
assert(
  tabIconAlpha(0, 0) < 16 &&
    tabIconAlpha(3, 3) === 255 &&
    tabIconAlpha(1, 8) === 255 &&
    tabIconAlpha(8, 1) === 255 &&
    tabIconAlpha(16, 16) === 255,
  'The inline tab favicon must retain the rounded-square silhouette',
);

for (const [page, seo] of INDEXABLE_PAGES) {
  const file = fileForPage(seo);
  assert(existsSync(file), `${page} static document is missing at ${file}`);

  const html = readFileSync(file, 'utf8');
  assert(count(html, /<title>/g) === 1, `${page} must have exactly one title`);
  assert(
    count(html, /<meta name="description"/g) === 1,
    `${page} must have exactly one description`,
  );
  assert(
    count(html, /<meta name="robots"/g) === 1,
    `${page} must have exactly one robots directive`,
  );
  assert(
    count(html, /<link rel="canonical"/g) === 1,
    `${page} must have exactly one canonical`,
  );
  assert(
    count(html, /<link rel="icon"/g) === 2 &&
      html.includes(
        '<link rel="icon" type="image/png" sizes="192x192" href="/favicon-cupi.png" />',
      ) &&
      html.includes(inlineTabIconLink),
    `${page} must pair the circular search favicon with the inline squircle tab icon`,
  );
  assert(
    count(html, /<link rel="apple-touch-icon"/g) === 1 &&
      html.includes('<link rel="apple-touch-icon" href="/favicon-cupi.png" />'),
    `${page} must use the same stable circular asset for its touch icon`,
  );
  const stylePreloads = html.match(/<link rel="preload" as="style"[^>]*>/g) ?? [];
  const expectedStylePreloads =
    ['work', 'members', 'sponsors', 'apply'].includes(page) || seo.chunk === 'apply' ? 1 : 0;
  assert(
    stylePreloads.length === expectedStylePreloads,
    `${page} has an incorrect number of route stylesheet preloads`,
  );
  for (const stylePreload of stylePreloads) {
    assert(
      /\scrossorigin(?:\s|=)/.test(stylePreload),
      `${page} stylesheet preload must match the route stylesheet credentials mode`,
    );
  }
  assert(count(html, /<h1>/g) === 1, `${page} static fallback must have one H1`);
  // The crawlable fallback must be invisible to anyone whose browser runs scripts,
  // and that must not depend on any script of ours running. It is hidden by a plain
  // rule and revealed only inside <noscript>.
  assert(
    /\.seo-fallback\s*\{\s*display:\s*none;?\s*\}/.test(html),
    `${page} must hide the crawlable fallback unconditionally`,
  );
  const noscriptBlock = html.match(/<noscript>[\s\S]*?<\/noscript>/)?.[0] ?? '';
  assert(
    /\.seo-fallback\s*\{\s*display:\s*block;?\s*\}/.test(noscriptBlock),
    `${page} must reveal the fallback only for browsers without scripting`,
  );
  assert(
    !html.includes('data-cupi-booting'),
    `${page} still carries the retired script-driven fallback guard, which could expose it`,
  );
  const entrySource = capture(
    html,
    /<script type="module"[^>]+src="(\/assets\/index-[^"]+\.js)"/,
    `${page} entry script`,
  );
  const entryFile = join('docs', entrySource.replace(/^\/+/, ''));
  assert(existsSync(entryFile), `${page} entry script is missing: ${entryFile}`);
  assert(
    count(html, /id="seo-structured-data"/g) === 1,
    `${page} must have exactly one structured-data graph`,
  );

  const title = capture(html, /<title>(.*?)<\/title>/, `${page} title`);
  const description = capture(
    html,
    /<meta name="description" content="(.*?)"/,
    `${page} description`,
  );
  const canonical = capture(
    html,
    /<link rel="canonical" href="(.*?)"/,
    `${page} canonical`,
  );
  const heading = capture(html, /<h1>(.*?)<\/h1>/, `${page} static H1`);
  const fallbackIntro = capture(
    html,
    /<p class="seo-fallback__intro">(.*?)<\/p>/,
    `${page} static fallback intro`,
  );
  const json = capture(
    html,
    /<script id="seo-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    `${page} structured data`,
  );

  assert(title === escapeHtml(seo.title), `${page} title does not match the SEO map`);
  assert(description === escapeHtml(seo.description), `${page} description is incorrect`);
  assert(description.length >= 100, `${page} description is too short`);
  assert(canonical === canonicalUrlForPage(page), `${page} canonical is incorrect`);
  assert(heading === escapeHtml(seo.heading), `${page} static H1 does not match the SEO map`);
  assert(
    fallbackIntro === escapeHtml(seo.fallbackIntro ?? seo.description),
    `${page} static fallback intro does not match the SEO map`,
  );
  assert(html.includes('name="robots" content="index, follow'), `${page} is not indexable`);
  assert(html.includes('href="/work/"'), `${page} is missing crawlable primary links`);
  assert(
    html.includes(
      'Cornell Physical Intelligence (CUPI) is a Cornell University student robotics organization based in Ithaca, New York.',
    ),
    `${page} static footer has stale organization wording`,
  );
  assert(
    html.includes(
      '<span data-nosnippet><a href="https://hr.cornell.edu/about/workplace-rights/equal-education-and-employment">Equal Education &amp; Employment</a></span>',
    ),
    `${page} static footer must retain Cornell's EEEO link without exposing it as snippet copy`,
  );
  assert(
    !/registered student organization/i.test(html),
    `${page} must not contradict Cornell's current registration status`,
  );

  const data = JSON.parse(json);
  assert(Array.isArray(data['@graph']) && data['@graph'].length > 0, `${page} schema is empty`);
  const webPage = data['@graph'].find((node) => node['@type'] === 'WebPage');
  assert(webPage?.url === canonical, `${page} WebPage schema URL is incorrect`);
  assert(webPage?.['@id'] === `${canonical}#webpage`, `${page} WebPage schema ID is incorrect`);
  assert(webPage?.description === seo.description, `${page} WebPage description is incorrect`);

  if (page !== 'home') {
    // A page rendered from another route's chunk preloads that chunk instead.
    const chunkRoute = seo.chunk || page;
    const routeChunkName = `${chunkRoute[0].toUpperCase()}${chunkRoute.slice(1)}`;
    assert(
      new RegExp(`rel="modulepreload"[^>]+/assets/${routeChunkName}-[^"/]+\\.js`).test(html),
      `${page} is missing its route module preload`,
    );
  }

  // The active form page carries no crab, so no route may preload it. If the
  // closed variant returns (APPLY_ACTIVE=false), the crab becomes the LCP
  // again — restore the vite.config.js hint and this assertion's old form
  // together (both are in git history).
  const applyLcpPreloads = count(
    html,
    /<link rel="preload" as="image" type="image\/avif" href="\/img\/CrabOnBeach-760\.avif"[^>]*>/g,
  );
  assert(
    applyLcpPreloads === 0,
    `${page} preloads the apply crab, which is below the fold while the interest form is active`,
  );

  if (page === 'home') {
    const identityLinks = [...html.matchAll(/<link rel="me" href="([^"]+)" \/>/g)].map(
      (match) => match[1],
    );
    assert(
      JSON.stringify(identityLinks) === JSON.stringify(ORGANIZATION_SAME_AS),
      'Homepage rel=me links must match the canonical organization identity set',
    );
    assert(
      PAGE_SEO.home.title.startsWith('CUPI Cornell') &&
        PAGE_SEO.home.description.startsWith('CUPI Cornell is Cornell Physical Intelligence'),
      'Homepage metadata must lead with the exact branded CUPI Cornell identity',
    );
    assert(
      PAGE_SEO.home.fallbackIntro === ORGANIZATION_DESCRIPTION,
      'Homepage static fallback copy must remain presentation-identical',
    );
    const organization = data['@graph'].find((node) => node['@type'] === 'Organization');
    assert(organization, 'Homepage schema is missing the organization');
    assert(
      organization.description === ORGANIZATION_DESCRIPTION,
      'Organization schema description must remain canonical and unchanged',
    );
    assert(
      JSON.stringify(organization.alternateName) === JSON.stringify(SITE_ALTERNATE_NAMES),
      'Organization schema alternate names are missing or out of preference order',
    );
    assert(
      JSON.stringify(organization.sameAs) === JSON.stringify(ORGANIZATION_SAME_AS),
      'Organization schema must match the canonical organization identity set',
    );
    assert(organization.logo === `${SITE_URL}/favicon-cupi.png`, 'Organization logo is incorrect');
    assert(organization.email === 'cuphysint@cornell.edu', 'Organization email is incorrect');
    assert(
      organization.contactPoint?.['@type'] === 'ContactPoint' &&
        organization.contactPoint.contactType === 'General inquiries' &&
        organization.contactPoint.email === organization.email,
      'Organization contact point must match the public general-inquiries address',
    );
    assert(
      html.includes('mailto:cuphysint@cornell.edu'),
      'The structured organization email must also be visible to readers',
    );
    assert(html.includes('Ithaca, New York'), 'The structured organization location must be visible');
    const website = data['@graph'].find((node) => node['@type'] === 'WebSite');
    assert(
      JSON.stringify(website?.alternateName) === JSON.stringify(SITE_ALTERNATE_NAMES),
      'WebSite schema alternate names are missing or out of preference order',
    );
  }

  if (seo.report) {
    const article = data['@graph'].find((node) => node['@type'] === 'TechArticle');
    assert(article?.headline === seo.heading, `${page} report schema headline is incorrect`);
    assert(
      article?.datePublished === seo.report.publishedAt &&
        article.dateModified === seo.report.modifiedAt &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(article.dateModified),
      `${page} report schema dates must use the verified publication timestamp with a timezone`,
    );
    assert(
      article?.publisher?.['@id'] === `${SITE_URL}/#organization` &&
        article.publisher.name === 'Cornell Physical Intelligence' &&
        article.publisher.logo === `${SITE_URL}/favicon-cupi.png`,
      `${page} report schema publisher is incomplete`,
    );
    assert(
      article?.encoding?.contentUrl === `${SITE_URL}/docs/${seo.report.slug}.pdf`,
      `${page} report schema PDF is incorrect`,
    );
    assert(
      html.includes(`href="/docs/${seo.report.slug}.pdf"`),
      `${page} static HTML must link to its PDF`,
    );
    assert(
      html.includes(`<time datetime="${seo.lastModified}">${seo.report.lastModifiedLabel}</time>`),
      `${page} static HTML must expose its schema modification date`,
    );
    for (const section of seo.sections) {
      assert(
        html.includes(`<h2>${escapeHtml(section.heading)}</h2>`),
        `${page} static HTML is missing section: ${section.heading}`,
      );
    }
    const imagePath = join('docs', seo.image.replace(/^\/+/, ''));
    assert(existsSync(imagePath), `${page} social image is missing: ${imagePath}`);
    assert(
      html.includes(`<meta property="og:image" content="${SITE_URL}${seo.image}"`),
      `${page} is missing its Open Graph image`,
    );
  }

  for (const section of seo.fallbackSections ?? []) {
    assert(
      html.includes(`<h2>${escapeHtml(section.heading)}</h2>`),
      `${page} static HTML is missing fallback section: ${section.heading}`,
    );
    for (const paragraph of section.paragraphs) {
      assert(
        html.includes(`<p>${escapeHtml(paragraph)}</p>`),
        `${page} static HTML is missing fallback copy for: ${section.heading}`,
      );
    }
    for (const item of section.bullets ?? []) {
      assert(
        html.includes(`<li>${escapeHtml(item)}</li>`),
        `${page} static HTML is missing fallback list content for: ${section.heading}`,
      );
    }
  }

  for (const relatedPage of seo.relatedPages ?? []) {
    const relatedSeo = PAGE_SEO[relatedPage];
    assert(relatedSeo, `${page} references an unknown related page: ${relatedPage}`);
    assert(
      html.includes(`href="${relatedSeo.path}"`),
      `${page} static HTML must link to related page: ${relatedPage}`,
    );
  }
}

const workHtml = readFileSync(fileForPage(PAGE_SEO.work), 'utf8');
for (const [page, seo] of INDEXABLE_PAGES.filter(([, entry]) => entry.parentPage === 'work')) {
  assert(
    workHtml.includes(`href="${seo.path}"`),
    `Work static HTML must link to child route: ${page}`,
  );
}

const notFound = readFileSync('docs/404.html', 'utf8');
assert(notFound.includes('name="robots" content="noindex, follow"'), '404 must be noindex');
assert(!notFound.includes('type="module"'), '404 must not boot the homepage SPA');
assert(!notFound.includes('modulepreload'), '404 must not preload application modules');
assert(!notFound.includes('rel="stylesheet"'), '404 must not load application stylesheets');

const robots = readFileSync('docs/robots.txt', 'utf8');
assert(robots.includes('Allow: /'), 'robots.txt must allow crawling');
assert(
  robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`),
  'robots.txt must advertise the canonical sitemap',
);

const sitemap = readFileSync('docs/sitemap.xml', 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = INDEXABLE_PAGES.map(([page]) => canonicalUrlForPage(page));
assert(
  JSON.stringify(sitemapUrls) === JSON.stringify(expectedUrls),
  'Sitemap URL inventory or ordering does not match PAGE_SEO',
);
for (const [page, seo] of INDEXABLE_PAGES) {
  const entry = `<loc>${canonicalUrlForPage(page)}</loc>\n    <lastmod>${seo.lastModified}</lastmod>`;
  assert(sitemap.includes(entry), `Sitemap lastmod is missing or inaccurate for ${page}`);
}
assert(
  readFileSync('public/sitemap.xml', 'utf8') === sitemap,
  'The development and production sitemaps must be identical',
);

console.log(`SEO verification passed for ${INDEXABLE_PAGES.length} production routes.`);
