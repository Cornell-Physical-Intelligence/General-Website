import { readFileSync } from 'node:fs';
import {
  ORGANIZATION_SAME_AS,
  PAGE_SEO,
  SITE_ALTERNATE_NAMES,
  SITE_URL,
  canonicalUrlForPage,
} from '../src/seo.js';

const ORIGIN = (process.env.LIVE_SITE_ORIGIN ?? SITE_URL).replace(/\/$/, '');
const INDEXABLE_PAGES = Object.entries(PAGE_SEO).filter(([, seo]) => !seo.noindex);
const GOOGLEBOT =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const request = async (url, options = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
        ...options,
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'cache-control': 'no-cache',
          ...(options.headers ?? {}),
        },
      });
      const transientStatus =
        response.status === 408 || response.status === 429 || response.status >= 500;
      if (transientStatus && attempt < 3) {
        await response.body?.cancel();
        await sleep(attempt * 1_000);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(attempt * 1_000);
    }
  }

  throw lastError;
};

const fetchText = async (url, options) => {
  const response = await request(url, options);
  return { response, text: await response.text() };
};

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const readStructuredData = (html) => {
  const json = html.match(
    /<script id="seo-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/,
  )?.[1];
  assert(json, 'Live homepage is missing its structured-data graph');
  return JSON.parse(json);
};

const routeBodies = new Map();

for (const [page, seo] of INDEXABLE_PAGES) {
  const canonical = canonicalUrlForPage(page);
  const liveUrl = `${ORIGIN}${seo.path}`;
  const { response, text } = await fetchText(liveUrl);
  routeBodies.set(page, text);

  assert(response.status === 200, `${page} returned HTTP ${response.status}`);
  assert(response.url === liveUrl, `${page} resolved to ${response.url}, not ${liveUrl}`);
  assert(
    response.headers.get('content-type')?.includes('text/html'),
    `${page} did not return HTML`,
  );
  assert(
    !response.headers.get('x-robots-tag')?.toLowerCase().includes('noindex'),
    `${page} has an X-Robots-Tag noindex directive`,
  );
  assert(
    text.includes(`<title>${escapeHtml(seo.title)}</title>`),
    `${page} has the wrong live title`,
  );
  assert(
    text.includes(`<meta name="description" content="${escapeHtml(seo.description)}"`),
    `${page} has the wrong live description`,
  );
  assert(
    text.includes('name="robots" content="index, follow'),
    `${page} is missing its index, follow directive`,
  );
  assert(
    text.includes(`<link rel="canonical" href="${canonical}"`),
    `${page} has the wrong canonical URL`,
  );
  const faviconLinks = text.match(/<link rel="icon"[^>]+>/g) ?? [];
  assert(
    faviconLinks.length === 2 &&
      faviconLinks[0] ===
        '<link rel="icon" type="image/png" sizes="192x192" href="/favicon-cupi.png" />' &&
      faviconLinks[1].startsWith(
        '<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,',
      ),
    `${page} does not pair the circular search favicon with the inline squircle tab icon`,
  );
  const touchIconLinks = text.match(/<link rel="apple-touch-icon"[^>]+>/g) ?? [];
  assert(
    touchIconLinks.length === 1 &&
      touchIconLinks[0] === '<link rel="apple-touch-icon" href="/favicon-cupi.png" />',
    `${page} does not use the stable circular touch icon`,
  );
  const stylePreloads = text.match(/<link rel="preload" as="style"[^>]*>/g) ?? [];
  const expectedStylePreloads = ['work', 'members', 'sponsors', 'apply'].includes(page) || PAGE_SEO[page]?.chunk === 'apply' ? 1 : 0;
  assert(
    stylePreloads.length === expectedStylePreloads,
    `${page} has an incorrect number of live route stylesheet preloads`,
  );
  for (const stylePreload of stylePreloads) {
    assert(
      /\scrossorigin(?:\s|=)/.test(stylePreload),
      `${page} live stylesheet preload has a mismatched credentials mode`,
    );
  }
}

const faviconResponse = await request(`${ORIGIN}/favicon-cupi.png`, {
  headers: { accept: 'image/png' },
});
assert(faviconResponse.status === 200, `favicon returned HTTP ${faviconResponse.status}`);
assert(
  faviconResponse.headers.get('content-type')?.includes('image/png'),
  'favicon did not return a PNG content type',
);
const liveFavicon = Buffer.from(await faviconResponse.arrayBuffer());
assert(
  liveFavicon.equals(readFileSync('docs/favicon-cupi.png')),
  'live favicon bytes do not match the verified circular production asset',
);

const homeHtml = routeBodies.get('home');
const { response: googlebotResponse, text: googlebotHtml } = await fetchText(`${ORIGIN}/`, {
  headers: { 'user-agent': GOOGLEBOT },
});
assert(googlebotResponse.status === 200, 'Googlebot homepage request did not return HTTP 200');
assert(
  googlebotHtml === homeHtml,
  'Googlebot and default visitors received different homepage HTML',
);

const schema = readStructuredData(homeHtml);
const organization = schema['@graph']?.find((node) => node['@type'] === 'Organization');
const website = schema['@graph']?.find((node) => node['@type'] === 'WebSite');
assert(organization, 'Live homepage schema is missing the Organization node');
assert(website, 'Live homepage schema is missing the WebSite node');
assert(
  JSON.stringify(organization.alternateName) === JSON.stringify(SITE_ALTERNATE_NAMES),
  'Live Organization aliases have drifted',
);
assert(
  JSON.stringify(website.alternateName) === JSON.stringify(SITE_ALTERNATE_NAMES),
  'Live WebSite aliases have drifted',
);
assert(
  JSON.stringify(organization.sameAs) === JSON.stringify(ORGANIZATION_SAME_AS),
  'Live Organization identity URLs have drifted',
);
const liveIdentityLinks = [...homeHtml.matchAll(/<link rel="me" href="([^"]+)" \/>/g)].map(
  (match) => match[1],
);
assert(
  JSON.stringify(liveIdentityLinks) === JSON.stringify(ORGANIZATION_SAME_AS),
  'Live homepage rel=me links have drifted',
);
assert(
  organization.contactPoint?.['@type'] === 'ContactPoint' &&
    organization.contactPoint.contactType === 'General inquiries' &&
    organization.contactPoint.email === organization.email,
  'Live Organization contact point has drifted',
);

for (const [page, seo] of INDEXABLE_PAGES.filter(([, entry]) => entry.report)) {
  const reportSchema = readStructuredData(routeBodies.get(page));
  const article = reportSchema['@graph']?.find((node) => node['@type'] === 'TechArticle');
  assert(article, `${page} live schema is missing the TechArticle node`);
  assert(
    article.datePublished === seo.report.publishedAt &&
      article.dateModified === seo.report.modifiedAt &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(article.dateModified),
    `${page} live article dates are not the verified timezone-aware publication timestamp`,
  );
}

const { response: robotsResponse, text: robots } = await fetchText(`${ORIGIN}/robots.txt`);
assert(robotsResponse.status === 200, `robots.txt returned HTTP ${robotsResponse.status}`);
assert(/(^|\n)Allow:\s*\/(\s|$)/i.test(robots), 'robots.txt does not allow the site');
assert(
  robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`),
  'robots.txt does not advertise the canonical sitemap',
);

const { response: sitemapResponse, text: sitemap } = await fetchText(`${ORIGIN}/sitemap.xml`);
assert(sitemapResponse.status === 200, `sitemap.xml returned HTTP ${sitemapResponse.status}`);
assert(
  sitemapResponse.headers.get('content-type')?.includes('xml'),
  'sitemap.xml did not return an XML content type',
);
for (const [page, seo] of INDEXABLE_PAGES) {
  const canonical = canonicalUrlForPage(page);
  const entry = new RegExp(
    `<loc>${escapeRegExp(canonical)}<\\/loc>\\s*<lastmod>${escapeRegExp(seo.lastModified)}<\\/lastmod>`,
  );
  assert(entry.test(sitemap), `sitemap.xml is missing the current ${page} entry`);
}
const sitemapLocations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert(
  sitemapLocations.length === INDEXABLE_PAGES.length,
  `sitemap.xml contains ${sitemapLocations.length} URLs; expected ${INDEXABLE_PAGES.length}`,
);

const unknownPath = `/__cupi-live-seo-probe-${Date.now()}/`;
const { response: notFoundResponse, text: notFoundHtml } = await fetchText(
  `${ORIGIN}${unknownPath}`,
);
assert(notFoundResponse.status === 404, `Unknown URL returned HTTP ${notFoundResponse.status}`);
assert(
  notFoundHtml.includes('name="robots" content="noindex, follow"'),
  'The live 404 document is missing noindex, follow',
);

const httpResponse = await request(ORIGIN.replace(/^https:/, 'http:'), {
  redirect: 'manual',
});
assert(
  [301, 302, 307, 308].includes(httpResponse.status),
  `HTTP origin did not redirect (HTTP ${httpResponse.status})`,
);
assert(
  httpResponse.headers.get('location')?.startsWith(`${ORIGIN}/`),
  'HTTP origin did not redirect to the canonical HTTPS origin',
);

const slashlessResponse = await request(`${ORIGIN}/work`, { redirect: 'manual' });
assert(
  [301, 302, 307, 308].includes(slashlessResponse.status),
  `/work did not redirect to its trailing-slash canonical (HTTP ${slashlessResponse.status})`,
);
assert(
  new URL(slashlessResponse.headers.get('location'), ORIGIN).href === `${ORIGIN}/work/`,
  '/work did not redirect to /work/',
);

try {
  const { response, text } = await fetchText('https://cornell.campusgroups.com/cupi/home/');
  const entityLinkPattern = new RegExp(
    `<a(?=[^>]*href="${escapeRegExp(`${ORIGIN}/`)}")[^>]*>(?:[^<]|<(?!\\/a>))*Cornell Physical Intelligence \\(CUPI\\)(?:[^<]|<(?!\\/a>))*<\\/a>`,
    'i',
  );
  const entityLink = text.match(entityLinkPattern)?.[0];
  const isNofollow = /\brel="[^"]*\bnofollow\b[^"]*"/i.test(entityLink ?? '');
  if (response.status !== 200 || !entityLink || isNofollow) {
    console.warn(
      '::warning::The Cornell CampusGroups entity page no longer exposes the expected followed CUPI link.',
    );
  }
} catch (error) {
  console.warn(`::warning::CampusGroups backlink check was unavailable: ${error.message}`);
}

console.log(`Live SEO verification passed for ${INDEXABLE_PAGES.length} production routes.`);
