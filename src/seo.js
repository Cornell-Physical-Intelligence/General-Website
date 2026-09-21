import { REPORT_METADATA_BY_PAGE } from './data/reportMetadata.js';

export const SITE_URL = 'https://cornellphysicalintelligence.com';
export const SITE_NAME = 'Cornell Physical Intelligence';
export const SITE_ACRONYM = 'CUPI';
export const SITE_RELEASE_DATE = '2026-08-16';
export const HOME_LAST_MODIFIED = '2026-09-03';
export const SITE_ALTERNATE_NAMES = [
  SITE_ACRONYM,
  'Cornell University Physical Intelligence',
  'Cornell Physical Intelligence Club',
  'Cornell CUPI',
  'CUPI Cornell',
];

export const ORGANIZATION_DESCRIPTION =
  'Cornell Physical Intelligence (CUPI) is a Cornell University student robotics organization building systems for manipulation, autonomous perception, and navigation.';

// Reports ship their own cover; every other page shares the brand card at the site root.
export const DEFAULT_SOCIAL_IMAGE = {
  path: '/og-cupi.png',
  width: 1200,
  height: 630,
  alt: `The CUPI crab drawing above the name ${SITE_NAME}`,
};

export const PAGE_SEO = {
  home: {
    path: '/',
    navLabel: 'Home',
    title: 'CUPI Cornell | Cornell Physical Intelligence',
    heading: 'Cornell Physical Intelligence (CUPI)',
    description:
      'CUPI Cornell is Cornell Physical Intelligence, a Cornell University student robotics organization building systems for manipulation, autonomous perception, and navigation.',
    lastModified: HOME_LAST_MODIFIED,
  },
  work: {
    path: '/work/',
    navLabel: 'Work',
    title: 'Robotics Projects & Reports | Cornell Physical Intelligence',
    heading: 'Robotics Projects and Technical Reports',
    description:
      'Explore Cornell Physical Intelligence (CUPI) robotics projects in manipulation, autonomous perception, navigation, and the Anduril AI Grand Prix.',
    lastModified: '2026-08-21',
  },
  members: {
    path: '/members/',
    navLabel: 'Members',
    title: 'CUPI Team | Cornell Physical Intelligence',
    heading: 'Cornell Physical Intelligence Members',
    description:
      'Meet the Cornell students and faculty behind Cornell Physical Intelligence (CUPI) and its multidisciplinary robotics teams.',
    lastModified: '2026-08-21',
  },
  sponsors: {
    path: '/sponsors/',
    navLabel: 'Sponsors',
    title: 'Sponsors | Cornell Physical Intelligence (CUPI)',
    heading: 'Sponsor Cornell Physical Intelligence',
    description:
      'Meet the organizations supporting Cornell Physical Intelligence (CUPI) and learn how to sponsor student robotics research at Cornell University.',
    lastModified: '2026-08-24',
  },
  apply: {
    path: '/apply/',
    navLabel: 'Apply',
    title: 'CUPI Applications | Cornell Physical Intelligence',
    heading: 'Cornell Physical Intelligence Applications',
    description:
      'Apply to Cornell Physical Intelligence (CUPI): the form the Cornell robotics team currently has open, from the interest list to coffee chats and applications.',
    relatedHeading: 'Forms',
    lastModified: '2026-09-21',
  },
  // Each form the wiki publishes has a page of its own, so a link can point at
  // one form while /apply/ keeps showing whatever is open. The wiki decides
  // whether a form is open; the page says so when it is not.
  applyInterest: {
    path: '/apply/interest/',
    navLabel: 'Interest form',
    title: 'CUPI Interest Form | Cornell Physical Intelligence',
    heading: 'Cornell Physical Intelligence Interest Form',
    description:
      'Join the Cornell Physical Intelligence (CUPI) interest list: tell the Cornell robotics team who you are, your subteam of interest, and the coolest project you have built.',
    highlights: [],
    parentPage: 'apply',
    chunk: 'apply',
    bare: true,
    form: 'interest',
    lastModified: '2026-09-20',
  },
  applyCoffee: {
    path: '/apply/coffee/',
    navLabel: 'Coffee chats',
    title: 'CUPI Coffee Chats | Cornell Physical Intelligence',
    heading: 'Cornell Physical Intelligence Coffee Chats',
    description:
      'Request a coffee chat with a current Cornell Physical Intelligence (CUPI) member before you apply to the Cornell robotics team.',
    highlights: [],
    parentPage: 'apply',
    chunk: 'apply',
    bare: true,
    form: 'coffee',
    lastModified: '2026-09-21',
  },
  applyApplication: {
    path: '/apply/application/',
    navLabel: 'Application',
    title: 'CUPI Application | Cornell Physical Intelligence',
    heading: 'Cornell Physical Intelligence Application',
    description:
      'The application form for Cornell Physical Intelligence (CUPI), the Cornell University student robotics team.',
    highlights: [],
    parentPage: 'apply',
    chunk: 'apply',
    bare: true,
    form: 'application',
    lastModified: '2026-09-21',
  },
  aboutCupi: {
    path: '/about-cupi/',
    navLabel: 'About',
    title: 'CUPI Cornell | Cornell Physical Intelligence Club',
    heading: 'CUPI Cornell: Cornell Physical Intelligence',
    description:
      'CUPI Cornell — also called Cornell CUPI — is Cornell Physical Intelligence, the Cornell University student robotics club building manipulation, perception, and navigation systems.',
    lastModified: '2026-08-21',
    faqs: [
      {
        question: 'What is CUPI Cornell?',
        answer:
          'CUPI Cornell is Cornell Physical Intelligence (CUPI), a Cornell University student robotics organization in Ithaca, New York. Cornell lists the group as the Cornell Physical Intelligence Club.',
      },
      {
        question: 'What is Cornell CUPI?',
        answer:
          'Cornell CUPI is the same organization as CUPI Cornell and Cornell Physical Intelligence: the student team at Cornell University that builds robots for manipulation, autonomous perception, and navigation.',
      },
      {
        question: 'Is CUPI the Cornell Physical Intelligence Club?',
        answer:
          'Yes. CUPI is the short name for Cornell Physical Intelligence, which Cornell University lists as the Cornell Physical Intelligence Club.',
      },
      {
        question: 'What does the Cornell Physical Intelligence Club work on?',
        answer:
          'CUPI builds physical systems that reason and interact with the world, including robotic manipulation, vision-language-action policies, and autonomous drone perception and navigation. Physical intelligence, the field behind this work, is often called embodied AI: building robot systems that act in the physical world.',
      },
      {
        question: 'How do you join CUPI Cornell?',
        answer:
          'Applications open periodically on the CUPI apply page. When they are closed, prospective members can email cuphysint@cornell.edu about future Cornell CUPI recruitment.',
      },
    ],
  },
  faq: {
    path: '/faq/',
    navLabel: 'FAQ',
    title: 'CUPI FAQ | Cornell Physical Intelligence',
    heading: 'Cornell Physical Intelligence FAQ',
    description:
      'Answers to common questions about CUPI Cornell — Cornell Physical Intelligence: what the Cornell robotics club builds, its subteams, how to join Cornell CUPI, and how to contact the team.',
    lastModified: '2026-08-22',
    faqs: [
      {
        question: 'What is CUPI Cornell?',
        answer:
          'CUPI Cornell is Cornell Physical Intelligence (CUPI), a Cornell University student robotics organization based in Ithaca, New York. The team builds systems for robotic manipulation, autonomous perception, and navigation.',
      },
      {
        question: 'Is Cornell CUPI an official Cornell club?',
        answer:
          'Yes. Cornell lists CUPI on its Campus Groups platform as the Cornell Physical Intelligence Club, at cornell.campusgroups.com/cupi/home/. The listing is where members manage membership and see club events.',
      },
      {
        question: 'What does Cornell Physical Intelligence build?',
        answer:
          'CUPI builds physical systems that can reason and interact with their environments. The team works across robotic manipulation, autonomous perception, and navigation.',
      },
      {
        question: 'What is the VQ1 deterministic policy report about?',
        answer:
          'It documents how CUPI cleared all six AI Grand Prix VQ1 gates with deterministic dead reckoning, monocular corrections, and no learned policy component.',
      },
      {
        question: 'What is Racing Without a Map?',
        answer:
          'Racing Without a Map is a CUPI technical survey of camera-and-IMU drone racing, bearings-only guidance, optical looming, control-rate limits, and mapless system design.',
      },
      {
        question: 'What subteams does CUPI have?',
        answer:
          'CUPI organizes work across four subteams: Mechanical, Electrical, Software, and Business & Marketing.',
      },
      {
        question: 'How do I join Cornell CUPI?',
        answer:
          'Check the CUPI applications page for the current application status. When applications are closed, prospective members can email cuphysint@cornell.edu about future Cornell CUPI recruitment.',
      },
      {
        question: 'Where is the CUPI wiki?',
        answer:
          'The team wiki is at wiki.cornellphysicalintelligence.com. It holds CUPI subteam documentation, project pages, and team processes, and members sign in with a cornell.edu Google account.',
      },
      {
        question: 'How can I contact CUPI?',
        answer:
          'Email cuphysint@cornell.edu for general inquiries. Prospective sponsors and members can also reach the team through the Cornell Physical Intelligence Club listing on Campus Groups.',
      },
    ],
  },
  vq1Report: {
    path: REPORT_METADATA_BY_PAGE.vq1Report.path,
    navLabel: REPORT_METADATA_BY_PAGE.vq1Report.cardTitle,
    title: REPORT_METADATA_BY_PAGE.vq1Report.metaTitle,
    heading: REPORT_METADATA_BY_PAGE.vq1Report.title,
    description: REPORT_METADATA_BY_PAGE.vq1Report.description,
    image: REPORT_METADATA_BY_PAGE.vq1Report.image,
    report: REPORT_METADATA_BY_PAGE.vq1Report,
    parentPage: 'work',
    lastModified: REPORT_METADATA_BY_PAGE.vq1Report.lastModified,
  },
  racingReport: {
    path: REPORT_METADATA_BY_PAGE.racingReport.path,
    navLabel: REPORT_METADATA_BY_PAGE.racingReport.cardTitle,
    title: REPORT_METADATA_BY_PAGE.racingReport.metaTitle,
    heading: REPORT_METADATA_BY_PAGE.racingReport.title,
    description: REPORT_METADATA_BY_PAGE.racingReport.description,
    image: REPORT_METADATA_BY_PAGE.racingReport.image,
    report: REPORT_METADATA_BY_PAGE.racingReport,
    parentPage: 'work',
    lastModified: REPORT_METADATA_BY_PAGE.racingReport.lastModified,
  },
  notFound: {
    path: '/404.html',
    navLabel: 'Not found',
    title: 'Page Not Found | Cornell Physical Intelligence',
    heading: 'Page not found',
    description: 'The requested Cornell Physical Intelligence page could not be found.',
    noindex: true,
    lastModified: SITE_RELEASE_DATE,
  },
};

export const getPageSeo = (page) => PAGE_SEO[page] ?? PAGE_SEO.home;

export const canonicalUrlForPage = (page) => `${SITE_URL}${getPageSeo(page).path}`;

export const socialImageForPage = (page) => {
  const seo = getPageSeo(page);
  return seo.image
    ? {
        path: seo.image,
        width: seo.report.imageWidth,
        height: seo.report.imageHeight,
        alt: `Cover of ${seo.heading}`,
      }
    : DEFAULT_SOCIAL_IMAGE;
};

// Labeled profile links shared by the Organization entity graph and the static footer.
export const ORGANIZATION_LINKS = [
  { label: 'GitHub', href: 'https://github.com/Cornell-Physical-Intelligence' },
  { label: 'Instagram', href: 'https://www.instagram.com/cornellphysicalintelligence/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/cu-physical-intelligence/' },
  { label: 'YouTube', href: 'https://www.youtube.com/@cornellphysicalintelligence' },
  { label: 'CUPI Wiki', href: 'https://wiki.cornellphysicalintelligence.com/' },
];

// One canonical identity set powers structured data and the homepage's rel=me links.
// Keeping the Cornell listing beside CUPI's own profiles gives crawlers the same
// unambiguous entity graph whether they read JSON-LD or ordinary document metadata.
export const ORGANIZATION_SAME_AS = [
  'https://cornell.campusgroups.com/cupi/home/',
  ...ORGANIZATION_LINKS.map(({ href }) => href),
];

const organizationNode = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/favicon-cupi.png`,
  email: 'cuphysint@cornell.edu',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'General inquiries',
    email: 'cuphysint@cornell.edu',
  },
  description: ORGANIZATION_DESCRIPTION,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Ithaca',
    addressRegion: 'NY',
    postalCode: '14853',
    addressCountry: 'US',
  },
  sameAs: ORGANIZATION_SAME_AS,
};

const websiteNode = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  publisher: { '@id': `${SITE_URL}/#organization` },
  inLanguage: 'en-US',
};

export const structuredDataForPage = (page) => {
  const seo = getPageSeo(page);
  if (seo.noindex) return null;

  const url = canonicalUrlForPage(page);
  const webPage = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: seo.heading,
    description: seo.description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-US',
  };

  if (seo.report) {
    webPage.mainEntity = { '@id': `${url}#report` };
    webPage.dateModified = seo.lastModified;
  }

  const graph = page === 'home' ? [organizationNode, websiteNode, webPage] : [webPage];

  if (seo.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      url,
      mainEntity: seo.faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
      about: { '@id': `${SITE_URL}/#organization` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-US',
    });
  }

  if (page !== 'home') {
    const parent = seo.parentPage ? getPageSeo(seo.parentPage) : null;
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: `${SITE_URL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: parent?.navLabel ?? seo.navLabel,
          item: parent ? canonicalUrlForPage(seo.parentPage) : url,
        },
        ...(parent
          ? [{ '@type': 'ListItem', position: 3, name: seo.navLabel, item: url }]
          : []),
      ],
    });
  }

  if (seo.report) {
    graph.push({
      '@type': 'TechArticle',
      '@id': `${url}#report`,
      url,
      headline: seo.heading,
      description: seo.description,
      image: `${SITE_URL}${seo.image}`,
      author: {
        '@type': 'Organization',
        name: seo.report.authors,
        parentOrganization: { '@id': `${SITE_URL}/#organization` },
      },
      publisher: {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/favicon-cupi.png`,
      },
      datePublished: seo.report.publishedAt,
      dateModified: seo.report.modifiedAt,
      inLanguage: 'en-US',
      encoding: {
        '@type': 'MediaObject',
        contentUrl: `${SITE_URL}/docs/${seo.report.slug}.pdf`,
        encodingFormat: 'application/pdf',
      },
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
};

// Static route documents carry the correct head before JavaScript runs. When a visitor
// moves between them without a reload, keep that same information aligned with the URL.
export const applyPageSeo = (page) => {
  if (typeof document === 'undefined') return;

  const seo = getPageSeo(page);
  const url = canonicalUrlForPage(page);
  const image = socialImageForPage(page);
  const setContent = (selector, content) => {
    document.querySelector(selector)?.setAttribute('content', content);
  };

  document.title = seo.title;
  setContent('meta[name="description"]', seo.description);
  setContent('meta[property="og:title"]', seo.title);
  setContent('meta[property="og:description"]', seo.description);
  setContent('meta[property="og:url"]', url);
  setContent('meta[name="twitter:title"]', seo.title);
  setContent('meta[name="twitter:description"]', seo.description);
  setContent('meta[name="twitter:card"]', 'summary_large_image');
  setContent('meta[property="og:image"]', `${SITE_URL}${image.path}`);
  setContent('meta[property="og:image:width"]', String(image.width));
  setContent('meta[property="og:image:height"]', String(image.height));
  setContent('meta[property="og:image:alt"]', image.alt);
  setContent('meta[name="twitter:image"]', `${SITE_URL}${image.path}`);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);

  const data = structuredDataForPage(page);
  let script = document.querySelector('#seo-structured-data');
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = 'seo-structured-data';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data).replaceAll('<', '\\u003c');
};
