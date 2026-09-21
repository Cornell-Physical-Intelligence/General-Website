import {
  ORGANIZATION_DESCRIPTION,
  PAGE_SEO as RUNTIME_PAGE_SEO,
} from './seo.js';
import { REPORT_BY_PAGE } from './data/reportContent.js';
import { SUBTEAMS } from './data/subteams.js';
import { WORK_AREAS, normalizedWorkSummary } from './data/workAreas.js';

// Search engines receive these richer fallback documents from the build. Keeping their
// prose out of the runtime SEO map prevents fallback-only content from joining every
// visitor's initial module graph while preserving one source for shared page metadata.
const BUILD_ENRICHMENT = {
  home: {
    fallbackIntro: ORGANIZATION_DESCRIPTION,
    highlights: [
      'Intelligent robotic manipulation',
      'Autonomous perception and navigation',
      'Multidisciplinary mechanical, electrical, and software engineering',
    ],
    relatedPages: ['vq1Report', 'racingReport'],
    relatedHeading: 'Latest technical reports',
    fallbackSections: [
      {
        heading: 'About Cornell Physical Intelligence',
        paragraphs: [
          'Cornell Physical Intelligence (CUPI), listed by Cornell as the Cornell Physical Intelligence Club, is a Cornell University student robotics organization. We create physical systems that can intelligently reason and interact with their environments. The gap between AI software and hardware needs to be closed seamlessly, and through our multidisciplinary team, we pursue this symbiosis. We prioritize creative, ambitious, and self-starting thinkers, because the problems worth solving here do not come with instructions.',
        ],
      },
      {
        heading: 'CUPI Subteams',
        paragraphs: [],
        bullets: SUBTEAMS.map((team) => `${team.title}: ${team.description}`),
      },
    ],
  },
  work: {
    highlights: [
      'Robotic manipulation with vision-language-action policies',
      'Autonomous drone perception and navigation',
      'CUPI technical reports and project results',
    ],
    fallbackSections: WORK_AREAS.map((area) => ({
      heading: area.title,
      paragraphs: [normalizedWorkSummary(area)],
    })),
  },
  members: {
    highlights: [
      'Mechanical, electrical, software, and business teams',
      'Cornell student researchers and builders',
      'Cornell faculty supporting CUPI robotics work',
    ],
  },
  sponsors: {
    highlights: [
      'Support student-led robotics at Cornell',
      'Help fund robots, sensors, and computing',
      'Read the CUPI sponsorship packet',
    ],
    fallbackSections: [
      {
        heading: 'Current CUPI sponsors',
        paragraphs: [
          'Cornell Physical Intelligence is supported by CU GeoData, Picogrid, Modovolo, Tantalus, and UPS.',
        ],
      },
      {
        heading: 'Sponsor CUPI robotics',
        paragraphs: [
          'Sponsorship helps fund the robots and computing used by Cornell Physical Intelligence. Prospective sponsors can read the CUPI sponsorship packet and contact the team at ab3233@cornell.edu.',
        ],
      },
    ],
  },
  apply: {
    highlights: [
      'Send the form the CUPI team currently has open',
      'Each form has a page of its own for a direct link',
      'Explore CUPI robotics projects and technical reports',
    ],
    fallbackSections: [
      {
        heading: 'Joining CUPI',
        paragraphs: [
          'The Apply page shows the form the team currently has open, from the interest list to coffee chats and applications; each form also has a page of its own. The team reaches out from what you send when recruiting moves along.',
          'Questions about recruitment can go to cuphysint@cornell.edu.',
        ],
      },
    ],
  },
  vq1Report: {
    highlights: REPORT_BY_PAGE.vq1Report.highlights,
    sections: REPORT_BY_PAGE.vq1Report.sections,
  },
  racingReport: {
    highlights: REPORT_BY_PAGE.racingReport.highlights,
    sections: REPORT_BY_PAGE.racingReport.sections,
  },
  aboutCupi: {
    fallbackIntro:
      'CUPI Cornell, also searched as Cornell CUPI, is Cornell Physical Intelligence — the Cornell University student robotics club listed by Cornell as the Cornell Physical Intelligence Club.',
    highlights: [
      'CUPI Cornell is Cornell Physical Intelligence (CUPI)',
      'Cornell CUPI is a Cornell University student robotics club',
      'Official Cornell listing: Cornell Physical Intelligence Club',
    ],
    fallbackSections: [
      {
        heading: 'What is CUPI Cornell?',
        paragraphs: [
          'CUPI Cornell is Cornell Physical Intelligence (CUPI), a Cornell University student robotics organization in Ithaca, New York. Cornell lists the group as the Cornell Physical Intelligence Club.',
        ],
      },
      {
        heading: 'What is Cornell CUPI?',
        paragraphs: [
          'Cornell CUPI is the same organization as CUPI Cornell and Cornell Physical Intelligence: the student team at Cornell University that builds robots for manipulation, autonomous perception, and navigation.',
        ],
      },
      {
        heading: 'Is CUPI the Cornell Physical Intelligence Club?',
        paragraphs: [
          'Yes. CUPI is the short name for Cornell Physical Intelligence, which Cornell University lists as the Cornell Physical Intelligence Club.',
        ],
      },
      {
        heading: 'What does the Cornell Physical Intelligence Club work on?',
        paragraphs: [
          'CUPI builds physical systems that reason and interact with the world, including robotic manipulation, vision-language-action policies, and autonomous drone perception and navigation. Physical intelligence, the field behind this work, is often called embodied AI: building robot systems that act in the physical world.',
        ],
      },
      {
        heading: 'How do you join CUPI Cornell?',
        paragraphs: [
          'Applications open periodically on the CUPI apply page. When they are closed, prospective members can email cuphysint@cornell.edu about future Cornell CUPI recruitment.',
        ],
      },
    ],
  },
  faq: {
    fallbackIntro:
      'Answers to common questions about CUPI Cornell and Cornell CUPI: what Cornell Physical Intelligence builds, how its subteams are organized, and how to join or contact the team.',
    highlights: [
      'What CUPI Cornell builds and studies',
      'How to join Cornell CUPI',
      'Where to find CUPI reports and the team wiki',
    ],
    relatedPages: ['vq1Report', 'racingReport'],
    relatedHeading: 'CUPI technical reports mentioned in this FAQ',
    fallbackSections: [
      {
        heading: 'What is CUPI Cornell?',
        paragraphs: [
          'CUPI Cornell is Cornell Physical Intelligence (CUPI), a Cornell University student robotics organization based in Ithaca, New York. The team builds systems for robotic manipulation, autonomous perception, and navigation.',
        ],
      },
      {
        heading: 'Is Cornell CUPI an official Cornell club?',
        paragraphs: [
          'Yes. Cornell lists CUPI on its Campus Groups platform as the Cornell Physical Intelligence Club, at cornell.campusgroups.com/cupi/home/. The listing is where members manage membership and see club events.',
        ],
      },
      {
        heading: 'What does Cornell Physical Intelligence build?',
        paragraphs: [
          'CUPI builds physical systems that can reason and interact with their environments. The team works across robotic manipulation, autonomous perception, and navigation.',
        ],
      },
      {
        heading: 'What is the VQ1 deterministic policy report about?',
        paragraphs: [
          'It documents how CUPI cleared all six AI Grand Prix VQ1 gates with deterministic dead reckoning, monocular corrections, and no learned policy component.',
        ],
      },
      {
        heading: 'What is Racing Without a Map?',
        paragraphs: [
          'Racing Without a Map is a CUPI technical survey of camera-and-IMU drone racing, bearings-only guidance, optical looming, control-rate limits, and mapless system design.',
        ],
      },
      {
        heading: 'What subteams does CUPI have?',
        paragraphs: [
          'CUPI organizes work across four subteams: Mechanical, Electrical, Software, and Business & Marketing.',
        ],
      },
      {
        heading: 'How do I join Cornell CUPI?',
        paragraphs: [
          'Check the CUPI applications page for the current application status. When applications are closed, prospective members can email cuphysint@cornell.edu about future Cornell CUPI recruitment.',
        ],
      },
      {
        heading: 'Where is the CUPI wiki?',
        paragraphs: [
          'The team wiki is at wiki.cornellphysicalintelligence.com. It holds CUPI subteam documentation, project pages, and team processes, and members sign in with a cornell.edu Google account.',
        ],
      },
      {
        heading: 'How can I contact CUPI?',
        paragraphs: [
          'Email cuphysint@cornell.edu for general inquiries. Prospective sponsors and members can also reach the team through the Cornell Physical Intelligence Club listing on Campus Groups.',
        ],
      },
    ],
  },
  notFound: {
    highlights: [],
  },
};

export const PAGE_SEO = Object.fromEntries(
  Object.entries(RUNTIME_PAGE_SEO).map(([page, seo]) => [
    page,
    { ...seo, ...BUILD_ENRICHMENT[page] },
  ]),
);

export const getPageSeo = (page) => PAGE_SEO[page] ?? PAGE_SEO.home;

export {
  DEFAULT_SOCIAL_IMAGE,
  HOME_LAST_MODIFIED,
  ORGANIZATION_DESCRIPTION,
  ORGANIZATION_LINKS,
  ORGANIZATION_SAME_AS,
  SITE_ACRONYM,
  SITE_ALTERNATE_NAMES,
  SITE_NAME,
  SITE_RELEASE_DATE,
  SITE_URL,
  canonicalUrlForPage,
  socialImageForPage,
  structuredDataForPage,
} from './seo.js';
