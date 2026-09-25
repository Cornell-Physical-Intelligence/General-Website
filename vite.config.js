import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { APPLY_ART_PICTURES } from './src/data/applyArt.js'
import { GALLERY_IMAGES, galleryPictureFor } from './src/data/gallery.js'
import { SPONSOR_ART_PICTURES } from './src/data/sponsorArt.js'
import { PROFESSORS, TEAM_SECTIONS } from './src/data/team.js'
import {
  ORGANIZATION_LINKS,
  ORGANIZATION_SAME_AS,
  PAGE_SEO,
  SITE_ACRONYM,
  SITE_NAME,
  SITE_URL,
  canonicalUrlForPage,
  getPageSeo,
  socialImageForPage,
  structuredDataForPage,
} from './src/seoBuild.js'

// Pages for this repo serves the `main` branch's /docs folder, so this is where the
// production build lands. It is read back from the resolved config rather than assumed,
// so `vite build --outDir somewhere/else` still emits its route pages into the right
// place — which is what makes it possible to build a copy for measurement without
// touching the committed one.
const DEFAULT_OUT_DIR = 'docs'

// The asset pipeline keeps one canonical manifest, but the browser only needs Work's
// poster view. Gallery and one-off art paths follow deterministic resize rules and are
// constructed from their single runtime source of truth; report pages follow a fixed
// slug/page/width pattern. buildStart validates every direct record against the generated
// manifest, so none of those repetitive AVIF/WebP paths need to ship as JavaScript.
const IMAGE_MANIFEST_PREFIX = 'virtual:cupi-image-manifest/'
const RESOLVED_IMAGE_MANIFEST_PREFIX = `\0${IMAGE_MANIFEST_PREFIX}`
const PEOPLE_IMAGE_MANIFEST = 'virtual:cupi-people-image-manifest'
const RESOLVED_PEOPLE_IMAGE_MANIFEST = `\0${PEOPLE_IMAGE_MANIFEST}`
const PEOPLE_IMAGE_WIDTHS = [160, 240, 320, 480]
const PEOPLE_IMAGE_FORMATS = ['avif', 'webp']
const PEOPLE_IMAGE_NAMES = [
  ...new Set([
    ...TEAM_SECTIONS.flatMap(({ members }) => members),
    ...PROFESSORS,
  ].map(({ imageBase }) => imageBase).filter(Boolean)),
  'Placeholder',
].sort()
const IMAGE_MANIFEST_GROUPS = {
  work: ['poster'],
}
const DIRECT_RUNTIME_IMAGE_GROUPS = ['galleryThumb', 'galleryFull', 'art']
const DIRECT_REPORTS = Object.values(PAGE_SEO)
  .filter((seo) => seo.report)
  .map((seo) => seo.report)
const DIRECT_IMAGE_MANIFEST_GROUPS = DIRECT_REPORTS.map(
  ({ slug }) => `report:${slug}`,
)
const REPORT_IMAGE_VARIANTS = [
  { width: 860, height: 1113 },
  { width: 1122, height: 1452 },
]
const readImageManifest = () =>
  JSON.parse(readFileSync(new URL('./src/data/generated/images.json', import.meta.url), 'utf8'))

const imageManifestModules = () => ({
  name: 'image-manifest-modules',

  buildStart() {
    const manifest = readImageManifest()
    const actual = Object.keys(manifest).sort()
    const configured = [
      ...Object.values(IMAGE_MANIFEST_GROUPS).flat(),
      ...DIRECT_RUNTIME_IMAGE_GROUPS,
      ...DIRECT_IMAGE_MANIFEST_GROUPS,
    ]
    const unique = [...new Set(configured)].sort()
    if (
      unique.length !== configured.length ||
      JSON.stringify(unique) !== JSON.stringify(actual)
    ) {
      throw new Error('Image manifest families must cover every generated group exactly once')
    }

    const pictureFromManifest = (formats = {}) => {
      const avif = formats.avif ?? []
      const webp = formats.webp ?? []
      const largest = webp.at(-1) ?? avif.at(-1)
      return largest
        ? {
            avif: avif.map(({ src, w }) => `${src} ${w}w`).join(', '),
            webp: webp.map(({ src, w }) => `${src} ${w}w`).join(', '),
            src: largest.src,
            width: largest.w,
            height: largest.h,
          }
        : null
    }
    const assertDirectPicture = (group, name, expected) => {
      const generated = pictureFromManifest(manifest[group]?.[name])
      if (JSON.stringify(generated) !== JSON.stringify(expected)) {
        throw new Error(`Deterministic image record changed for ${group}/${name}`)
      }
    }

    for (const image of GALLERY_IMAGES) {
      assertDirectPicture('galleryThumb', image.name, galleryPictureFor(image, 'thumb'))
      assertDirectPicture('galleryFull', image.name, galleryPictureFor(image, 'full'))
    }

    const artPictures = { ...APPLY_ART_PICTURES, ...SPONSOR_ART_PICTURES }
    if (
      JSON.stringify(Object.keys(artPictures).sort()) !==
      JSON.stringify(Object.keys(manifest.art ?? {}).sort())
    ) {
      throw new Error('Deterministic art records must cover every generated art image')
    }
    for (const [name, picture] of Object.entries(artPictures)) {
      assertDirectPicture('art', name, picture)
    }

    for (const report of DIRECT_REPORTS) {
      const group = manifest[`report:${report.slug}`] ?? {}
      const expectedNames = Array.from(
        { length: report.pageCount },
        (_, index) => `p${String(index + 1).padStart(2, '0')}`,
      )
      if (JSON.stringify(Object.keys(group).sort()) !== JSON.stringify(expectedNames)) {
        throw new Error(`Report image manifest is incomplete for ${report.slug}`)
      }

      for (const name of expectedNames) {
        for (const format of ['avif', 'webp']) {
          const expected = REPORT_IMAGE_VARIANTS.map(({ width, height }) => ({
            src: `/img/Reports/${report.slug}/${name}-${width}.${format}`,
            w: width,
            h: height,
          }))
          if (JSON.stringify(group[name]?.[format]) !== JSON.stringify(expected)) {
            throw new Error(
              `Report image pattern changed for ${report.slug}/${name}.${format}`,
            )
          }
        }
      }
    }

    const peopleFiles = readdirSync(
      new URL('./src/assets/people/sized/', import.meta.url),
    )
    const variantsByName = new Map()
    for (const file of peopleFiles) {
      const match = file.match(/^(.+)-(\d+)\.(avif|webp)$/)
      if (!match) throw new Error(`Unexpected portrait asset name: ${file}`)
      const [, name, width, format] = match
      const key = `${width}.${format}`
      const variants = variantsByName.get(name) ?? new Set()
      if (variants.has(key)) throw new Error(`Duplicate portrait variant: ${file}`)
      variants.add(key)
      variantsByName.set(name, variants)
    }
    const expectedVariants = PEOPLE_IMAGE_WIDTHS.flatMap((width) =>
      PEOPLE_IMAGE_FORMATS.map((format) => `${width}.${format}`),
    ).sort()
    if (
      JSON.stringify([...variantsByName.keys()].sort()) !==
      JSON.stringify(PEOPLE_IMAGE_NAMES)
    ) {
      throw new Error('Portrait image families must match the current roster exactly')
    }
    for (const [name, variants] of variantsByName) {
      if (JSON.stringify([...variants].sort()) !== JSON.stringify(expectedVariants)) {
        throw new Error(`Portrait image variants are incomplete for ${name}`)
      }
    }
  },

  resolveId(id) {
    if (id === PEOPLE_IMAGE_MANIFEST) return RESOLVED_PEOPLE_IMAGE_MANIFEST
    return id.startsWith(IMAGE_MANIFEST_PREFIX) ? `\0${id}` : null
  },

  hotUpdate({ file, timestamp }) {
    if (!/[\\/]src[\\/]assets[\\/]people[\\/]sized[\\/]/.test(file)) return
    const module = this.environment.moduleGraph.getModuleById(
      RESOLVED_PEOPLE_IMAGE_MANIFEST,
    )
    if (!module) return
    this.environment.moduleGraph.invalidateModule(module, new Set(), timestamp, true)
    return [module]
  },

  load(id) {
    if (id === RESOLVED_PEOPLE_IMAGE_MANIFEST) {
      const files = readdirSync(
        new URL('./src/assets/people/sized/', import.meta.url),
      ).sort()
      const names = [...new Set(files.map((file) => file.match(/^(.+)-\d+\./)?.[1]))]
      const imports = []
      let index = 0
      const importFor = (name, width, format) => {
        const local = `portrait${index++}`
        imports.push(
          `import ${local} from ${JSON.stringify(`/src/assets/people/sized/${name}-${width}.${format}?url`)}`,
        )
        return local
      }
      const pictures = names.map((name) => {
        const formats = PEOPLE_IMAGE_FORMATS.map((format) => {
          const variants = PEOPLE_IMAGE_WIDTHS.map((width) =>
            importFor(name, width, format),
          )
          return `[${variants.join(',')}]`
        })
        return `${JSON.stringify(name)}:[${formats.join(',')}]`
      })
      return `${imports.join('\n')}\nexport default {${pictures.join(',')}}`
    }

    if (!id.startsWith(RESOLVED_IMAGE_MANIFEST_PREFIX)) return null

    const family = id.slice(RESOLVED_IMAGE_MANIFEST_PREFIX.length)
    const groups = IMAGE_MANIFEST_GROUPS[family]
    if (!groups) throw new Error(`Unknown image manifest family: ${family}`)

    const manifest = readImageManifest()
    const pictures = Object.fromEntries(
      groups.map((group) => [
        group,
        Object.fromEntries(
          Object.entries(manifest[group] ?? {}).map(([name, formats]) => {
            const avif = formats.avif ?? []
            const webp = formats.webp ?? []
            const largest = webp.at(-1) ?? avif.at(-1)
            return [
              name,
              largest
                ? {
                    avif: avif.map(({ src, w }) => `${src} ${w}w`).join(', '),
                    webp: webp.map(({ src, w }) => `${src} ${w}w`).join(', '),
                    src: largest.src,
                    width: largest.w,
                    height: largest.h,
                  }
                : null,
            ]
          }),
        ),
      ]),
    )
    return `export default ${JSON.stringify(pictures)}`
  },
})

// Routes the app answers to. Home is the root index and needs no folder of its own.
const ROUTES = Object.entries(PAGE_SEO)
  .filter(([page, seo]) => page !== 'home' && !seo.noindex)
  .map(([page]) => page)

// GitHub Pages serves static files, so /work only resolves if a document actually lives
// there. Copying the built index.html into a folder per route makes each URL a real page
// that boots the app, which the router then reads back from the pathname. Doing it this
// way rather than with a 404 redirect means no flash of a wrong page on a deep link.
// The 404 copy is a safety net for anything not in the list.
//
// Each copy also declares the one route chunk that document is going to need. Every page
// is code-split, and without this a visitor opening /members waits out two round trips in
// series: fetch the entry chunk, run it, discover the dynamic import, fetch that. The
// browser cannot see past the first one on its own, because the second URL only exists
// inside the first file. Naming it in the HTML collapses the two into one — which is the
// whole point, since splitting is only free if the split half is not also serialised.

// Playfair is rasterised by the Voronoi hero and drawn into the sponsor lockups, and it is
// used nowhere else — no body copy, no headings, no nav. Preloading it from the shared
// <head> therefore pulled 23KB on /work, /members and /apply that those pages have no glyph
// to spend it on, which on /apply was a seventh of the entire page. The @font-face stays
// declared everywhere, so a visitor who navigates to the hero still gets the face; what is
// route-specific is only whether the fetch is forced up front.
const PLAYFAIR_ROUTES = new Set(['home', 'sponsors'])
const PLAYFAIR_PRELOAD = /\n\s*<link\b[^>]*playfair-display[^>]*>/i

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const seoHead = (page) => {
  const seo = getPageSeo(page)
  const url = canonicalUrlForPage(page)
  const robots = seo.noindex
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  const structuredData = structuredDataForPage(page)
  const jsonLd = structuredData
    ? `\n    <script id="seo-structured-data" type="application/ld+json">${JSON.stringify(
        structuredData,
        null,
        2,
      ).replaceAll('<', '\\u003c')}</script>`
    : ''
  const socialImage = (() => {
    const image = socialImageForPage(page)
    return `
    <meta property="og:image" content="${SITE_URL}${image.path}" />
    <meta property="og:image:width" content="${image.width}" />
    <meta property="og:image:height" content="${image.height}" />
    <meta property="og:image:alt" content="${escapeHtml(image.alt)}" />
    <meta name="twitter:image" content="${SITE_URL}${image.path}" />`
  })()
  const identityLinks =
    page === 'home'
      ? ORGANIZATION_SAME_AS.map(
          (href) => `\n    <link rel="me" href="${escapeHtml(href)}" />`,
        ).join('')
      : ''

  return `<!-- seo:head:start -->
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="robots" content="${robots}" />
    <meta name="application-name" content="${SITE_NAME}" />
    <link rel="canonical" href="${url}" />${identityLinks}
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />${socialImage}${jsonLd}
    <!-- seo:head:end -->`
}

const seoFallback = (page) => {
  const seo = getPageSeo(page)
  const nav = Object.entries(PAGE_SEO)
    .filter(
      ([key, entry]) =>
        !entry.noindex &&
        !entry.parentPage &&
        !['aboutCupi', 'faq'].includes(key),
    )
    .map(
      ([key, entry]) =>
        `<a href="${entry.path}"${key === page ? ' aria-current="page"' : ''}>${escapeHtml(
          entry.navLabel,
        )}</a>`,
    )
    .join('\n          ')
  const highlights = seo.highlights.length
    ? `\n        <ul class="seo-fallback__highlights">\n${seo.highlights
        .map((item) => `          <li>${escapeHtml(item)}</li>`)
        .join('\n')}\n        </ul>`
    : ''
  const contentSections = seo.sections ?? seo.fallbackSections
  const sections = contentSections?.length
    ? `
        <div class="seo-fallback__sections">
${contentSections
  .map(
    (section) => `          <section>
            <h2>${escapeHtml(section.heading)}</h2>
${section.paragraphs.map((paragraph) => `            <p>${escapeHtml(paragraph)}</p>`).join('\n')}
${section.bullets?.length ? `            <ul>\n${section.bullets.map((item) => `              <li>${escapeHtml(item)}</li>`).join('\n')}\n            </ul>` : ''}
          </section>`,
  )
  .join('\n')}
        </div>`
    : ''
  const reportLink = seo.report
    ? `
        <p>CUPI Technical Report · ${escapeHtml(seo.report.year)} · Updated <time datetime="${escapeHtml(
          seo.report.lastModified,
        )}">${escapeHtml(seo.report.lastModifiedLabel)}</time></p>
        <p><a href="/docs/${seo.report.slug}.pdf">Read the full ${escapeHtml(
          seo.report.pageCount,
        )}-page technical report (PDF)</a></p>`
    : ''
  const explicitRelatedLinks = (seo.relatedPages ?? [])
    .map((relatedPage) => PAGE_SEO[relatedPage])
    .filter((entry) => entry && !entry.noindex)
  const childLinks = Object.values(PAGE_SEO).filter(
    (entry) => !entry.noindex && entry.parentPage === page,
  )
  const relatedEntries = explicitRelatedLinks.length ? explicitRelatedLinks : childLinks
  const relatedLinks = relatedEntries.length
    ? `
        <section class="seo-fallback__related" aria-labelledby="seo-related-heading">
          <h2 id="seo-related-heading">${escapeHtml(
            seo.relatedHeading ?? 'CUPI technical reports',
          )}</h2>
          <ul>
${relatedEntries
  .map(
    (entry) =>
      `            <li><a href="${entry.path}">${escapeHtml(
        entry.report ? entry.heading : entry.navLabel,
      )}</a>${
        entry.report?.cardSubtitle ? ` — ${escapeHtml(entry.report.cardSubtitle)}` : ''
      }</li>`,
  )
  .join('\n')}
          </ul>
        </section>`
    : ''

  return `<!-- seo:fallback:start -->
    <div class="seo-fallback">
      <header class="seo-fallback__header">
        <a class="seo-fallback__brand" href="/">${SITE_NAME} (${SITE_ACRONYM})</a>
        <nav class="seo-fallback__nav" aria-label="Primary">
          ${nav}
        </nav>
      </header>
      <main class="seo-fallback__main">
        <p class="seo-fallback__eyebrow">${SITE_ACRONYM} at Cornell University</p>
        <h1>${escapeHtml(seo.heading)}</h1>
        <p class="seo-fallback__intro">${escapeHtml(seo.fallbackIntro ?? seo.description)}</p>${highlights}${relatedLinks}${reportLink}${sections}
      </main>
      <footer class="seo-fallback__footer">
        <p>${SITE_NAME} (${SITE_ACRONYM}) is a Cornell University student robotics organization based in Ithaca, New York.</p>
        <nav class="seo-fallback__links" aria-label="CUPI elsewhere">
${ORGANIZATION_LINKS.map(
  ({ label, href }) => `          <a href="${href}" rel="me">${escapeHtml(label)}</a>`,
).join('\n')}
        </nav>
        <p><a href="https://cornell.campusgroups.com/cupi/home/" rel="me">Official Cornell listing: Cornell Physical Intelligence Club</a></p>
        <p>General inquiries: <a href="mailto:cuphysint@cornell.edu">cuphysint@cornell.edu</a></p>
        <p><span data-nosnippet><a href="https://hr.cornell.edu/about/workplace-rights/equal-education-and-employment">Equal Education &amp; Employment</a></span></p>
      </footer>
    </div>
    <!-- seo:fallback:end -->`
}

const renderSeoDocument = (html, page) =>
  html
    .replace(/<!-- seo:head:start -->[\s\S]*?<!-- seo:head:end -->/, seoHead(page))
    .replace(
      /<!-- seo:fallback:start -->[\s\S]*?<!-- seo:fallback:end -->/,
      seoFallback(page),
    )

const sitemapDocument = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.entries(PAGE_SEO)
  .filter(([, seo]) => !seo.noindex)
  .map(
    ([page, seo]) => `  <url>
    <loc>${canonicalUrlForPage(page)}</loc>
    <lastmod>${seo.lastModified}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`

const notFoundDocument = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${seoHead('notFound')}
    <style>
      html { color-scheme: light dark; font-family: system-ui, sans-serif; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; text-align: center; }
      main { padding: 32px; }
      h1 { margin: 0 0 12px; font-size: clamp(2rem, 7vw, 5rem); font-weight: 500; }
      p { margin: 0; line-height: 1.6; }
      a { color: inherit; text-underline-offset: 0.2em; }
    </style>
      <script>(function () { var m = /^\\/apply\\/([a-z][a-z0-9_-]{0,39})\\/?$/.exec(location.pathname); if (m && ['interest', 'coffee', 'application'].indexOf(m[1]) < 0) location.replace('/apply/?form=' + m[1]); })();</script>
</head>
  <body>
    <main>
      <h1>${escapeHtml(getPageSeo('notFound').heading)}</h1>
      <p>The requested page could not be found. <a href="/">Return to Cornell Physical Intelligence.</a></p>
    </main>
  </body>
</html>
`

const pageFromDevPath = (path) => {
  const raw = path.replace(/index\.html$/, '') || '/'
  const normalized = raw === '/' || raw.endsWith('/') ? raw : `${raw}/`
  return (
    Object.entries(PAGE_SEO).find(([, seo]) => seo.path === normalized)?.[0] ?? 'home'
  )
}

// The same renderer powers development and the route copies emitted below. This keeps
// the browser's head, the committed static documents, and the client-side SEO map from
// quietly drifting into three versions of the organization name.
const seoDocuments = () => ({
  name: 'seo-documents',
  transformIndexHtml(html, context) {
    return renderSeoDocument(html, pageFromDevPath(context.path))
  },
})

const emitRoutePages = () => {
  // route -> { js, css[] }, filled in while the bundle still exists in memory.
  const chunks = {}
  let outDir = DEFAULT_OUT_DIR

  return {
    name: 'emit-route-pages',
    apply: 'build',

    configResolved(config) {
      outDir = config.build.outDir
    },

    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.facadeModuleId) continue
        const match = chunk.facadeModuleId.match(/src\/pages\/([^/]+)\.jsx$/)
        if (!match) continue
        chunks[match[1].toLowerCase()] = {
          js: chunk.fileName,
          css: [...(chunk.viteMetadata?.importedCss ?? [])],
        }
      }
    },

    closeBundle() {
      const base = readFileSync(join(outDir, 'index.html'), 'utf8')
      const heroWorkerFile = readdirSync(join(outDir, 'assets')).find((file) =>
        /^voronoi\.worker-[^.]+\.js$/.test(file),
      )
      const heroWorker = heroWorkerFile ? `assets/${heroWorkerFile}` : ''

      // modulepreload for the script (fetch, parse, and hold it ready as a module) and a
      // plain preload for its stylesheet — warming it rather than linking it, because the
      // chunk injects its own <link> when it runs and two live stylesheets for one file is
      // a needless thing to reason about later.
      const hints = (route) => {
        // A route that renders from another route's chunk (the standalone
        // form pages live in the apply chunk) preloads that chunk.
        const entry = chunks[(getPageSeo(route).chunk || route).toLowerCase()]
        const lines = []
        if (route === 'home' && heroWorker) {
          lines.push(
            `    <link rel="modulepreload" crossorigin href="/${heroWorker}" />`,
          )
        }
        if (entry) {
          lines.push(`    <link rel="modulepreload" crossorigin href="/${entry.js}" />`)
          for (const css of entry.css) {
            lines.push(`    <link rel="preload" as="style" crossorigin href="/${css}" />`)
          }
        }
        // The apply crab once earned a preload here as the route's LCP image. The
        // active form page has no crab at all, so no image hint: the form fields
        // own the first paint. If ApplyClosed ever becomes the live variant again,
        // the crab is the LCP once more and the preload is worth restoring (see
        // git history for the exact line).
        return `${lines.join('\n')}\n`
      }

      // Matched with its own indentation and put back with it, so a route that gets no
      // hints comes out byte-identical to the source document rather than quietly
      // re-indented.
      const CLOSING_HEAD = /([ \t]*)<\/head>/

      const withHints = (route) => {
        const lines = hints(route)
        const document = renderSeoDocument(base, route)
        const html = lines ? document.replace(CLOSING_HEAD, `${lines}$1</head>`) : document
        return PLAYFAIR_ROUTES.has(route) ? html : html.replace(PLAYFAIR_PRELOAD, '')
      }

      writeFileSync(join(outDir, 'index.html'), withHints('home'))
      for (const route of ROUTES) {
        const routeDir = getPageSeo(route).path.replace(/^\/+|\/+$/g, '')
        mkdirSync(join(outDir, routeDir), { recursive: true })
        writeFileSync(join(outDir, routeDir, 'index.html'), withHints(route))
      }
      writeFileSync(join(outDir, 'sitemap.xml'), sitemapDocument())
      // A standalone 404 carries no app chunks, stylesheets, or fonts. It cannot replace
      // itself with Home or spend bandwidth on assets that a not-found page never uses.
      writeFileSync(join(outDir, '404.html'), notFoundDocument())
    },
  }
}

// Pages for this repo serves the `main` branch's /docs folder, so the production build is
// written there and committed. base stays '/' because the site is served from a custom
// domain at the root, not from a project subpath.
export default defineConfig({
  base: '/',
  plugins: [imageManifestModules(), react(), seoDocuments(), emitRoutePages()],
  build: {
    outDir: DEFAULT_OUT_DIR,
    emptyOutDir: true,
    // Never base64 an asset into the bundle. The roster imports 272 portrait files (34
    // people x 4 widths x 2 formats) and most are under Vite's 4KB default, so the default
    // inlined them — which costs three ways at once: base64 is a third larger than the
    // bytes it carries, already-compressed image data does not gzip again, and every
    // variant lands in the bundle even though each visitor displays exactly one of the
    // eight. It put 314KB into a JS file that has to parse before anything renders.
    assetsInlineLimit: 0,
  },
})
