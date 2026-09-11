/**
 * Copy for the Field Station residency campaign page.
 *
 * Kept colocated with the route (rather than in `content/pages/en`) because the
 * page is a one-off campaign layout; the same pattern `/ukdebt` and
 * `/chatcontrol` follow. Strings are reproduced from the Figma source
 * (file ruOhApjVanmnLGJaakHmrn, node 17:328) so design review can diff copy in
 * one place.
 */
import type {
  CardGridSection,
  GiantSwitchSection,
  TableSection,
} from '@repo/content/schemas'

import { EXTERNAL_URLS } from '@/constants/routes'

export const SEO = {
  title: 'Field Station: Rajasthan Builder Residency | Logos x Zu-Grama',
  description:
    'Field Station is a one-week residency for scientists, engineers, and developers, Oct 23–31, 2026, on a 500-acre farm in Rajasthan. Hosted by Logos and Zu-Grama. Applications open Sept 11–26.',
} as const

export const OG_IMAGE = {
  src: '/campaigns/field-station/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Aerial view of the Field Station venue, a regenerative farm in Rajasthan',
} as const

/** In-page anchors the hero links to. */
export const SECTION_IDS = {
  about: 'about',
  tracks: 'tracks',
  applicationProcess: 'application-process',
  venue: 'venue',
  activities: 'activities',
} as const

/**
 * The Devfolio application URL is not in the design yet, so "Apply now" points
 * at the section that explains how to apply.
 */
export const APPLY_HREF = `#${SECTION_IDS.applicationProcess}`

const IMAGE_DIR = '/campaigns/field-station'

/**
 * Umami click names. The site-wide tracker otherwise names an event after the
 * element's text, which merges the two "Apply now" buttons and breaks when copy
 * changes; it attaches the page path as the event's `source`.
 */
export const EVENT_NAMES = {
  heroApply: 'Apply now - Hero',
  heroSectionLink: (label: string) => `Jump to ${label} - Hero`,
  applicationApply: 'Apply now - Application process',
  applicationInstall: 'Install Basecamp - Application process',
  applyBannerInstall: 'Install Basecamp - Apply banner',
  faqToggle: (question: string) => `FAQ - ${question}`,
}

/** The residency itself, for the page's schema.org Event. */
export const EVENT_DETAILS = {
  name: 'Field Station: Rajasthan Builder Residency',
  startDate: '2026-10-23',
  endDate: '2026-10-31',
  venue: 'Dhun',
  region: 'Rajasthan',
  countryCode: 'IN',
  partner: 'Zu-Grama',
} as const

export const HERO = {
  label: 'Field Station',
  heading: 'Rajasthan',
  /** Paragraph groups; Figma leaves a blank line between groups only. */
  body: [
    [
      'A one-week residency in Rajasthan that brings together scientists, engineers, cryptographers, and developers to build the parallel.',
      'Accepted residents will build alongside peers with the opportunity to present their work at a demo day. Accommodation and shared meals are covered.',
    ],
    [
      'The strongest prototypes from the Logos tracks, presented at Summit / demo day, will be eligible to unlock milestone-based grant funding.',
    ],
  ],
  cta: 'Apply now',
  status: 'Applications are open from 11 Sept to 26 Sept',
  links: [
    { label: 'About', href: `#${SECTION_IDS.about}` },
    { label: 'Tracks', href: `#${SECTION_IDS.tracks}` },
    {
      label: 'Application Process',
      href: `#${SECTION_IDS.applicationProcess}`,
    },
    { label: 'Venue', href: `#${SECTION_IDS.venue}` },
    { label: 'Activities', href: `#${SECTION_IDS.activities}` },
  ],
  image: `${IMAGE_DIR}/hero.webp`,
} as const

export const ABOUT = {
  heading: 'About the Programme',
  paragraphs: [
    'Field Station is a one-week residency programme at a 500-acre regenerative farm in Rajasthan, where accepted participants will come together to create a real, working parallel society: living, eating, debugging, and shipping solutions to real-world issues.',
    'Residents will choose one of the four tracks listed below to build a prototype. At the end of the one-week programme, a demo day will give participants the opportunity to showcase their work for a chance to win milestone-based grants to continue the project.',
  ],
  stats: [
    { label: 'Curated Residents', value: '30' },
    { label: 'Nights on Site', value: '8' },
  ],
  image: {
    src: `${IMAGE_DIR}/about.webp`,
    alt: 'Aerial view of the Field Station farm and haveli in Rajasthan',
  },
} as const

export const TRACKS = {
  heading: 'The Tracks',
  items: [
    {
      key: 'civic-prize',
      title: 'Logos Civic Prize',
      subtitle: 'Tools to rebuild civil society',
    },
    {
      key: 'sovereignty-privacy',
      title: 'Logos Sovereignty and Privacy',
      subtitle: 'Bring your own idea',
    },
    {
      key: 'zu-grama-dacc',
      title: 'Zu-Grama d/acc\n(decentralised acceleration)',
      subtitle: 'AI, neurotech, bio-resilience',
    },
    {
      key: 'resident',
      title: 'Resident, non-builder',
      subtitle: 'Join as an activist, community organiser, artist',
    },
  ],
} as const

export const APPLICATION_INTRO = {
  /** Figma breaks the paragraph by hand; the lines only break on desktop. */
  bodyLines: [
    'The residency programme is open to anyone who wants to participate in building',
    'a parallel society. While there is a focus on building shipping technical tools, creatives,',
    'designers, testers, and people with a passion for exploring new ways of living are',
    'welcome to apply to join.',
  ],
  note: 'The application process is simple and done through Devfolio.',
  image: {
    src: `${IMAGE_DIR}/application.webp`,
    alt: 'Wild grasses against a blue sky',
  },
} as const

const APPLICATION_STEPS = [
  'Select the track you wish to apply for.',
  'Explain your idea.',
  'Include relevant links to demos or prototypes (not required, but they will support your application).',
  'Install Logos Basecamp and retrieve your application code. Enter your code into the Devfolio application.',
  'Applications are reviewed by a panel of judges for each track.',
] as const

/**
 * `HowItWorksSection` renders its CTAs from `action` plus the first row's
 * `cta`, so the Basecamp install button rides on step 01. It keeps the
 * download icon because that is what switches on OS detection
 * (`isBasecampInstallCta`).
 */
export const APPLICATION: TableSection = {
  componentType: 'table',
  key: 'fieldStation.applicationProcess',
  title: 'The application process',
  action: {
    label: 'Apply now',
    href: APPLY_HREF,
    variant: 'secondary',
  },
  rows: APPLICATION_STEPS.map((step, index) => ({
    number: String(index + 1).padStart(2, '0'),
    title: step,
    description: step,
    ...(index === 0
      ? {
          cta: {
            label: 'Install Basecamp',
            href: EXTERNAL_URLS.basecampRelease,
            external: true,
            variant: 'primary' as const,
            iconOverride: 'download' as const,
          },
        }
      : {}),
  })),
}

export const TIMELINE = {
  heading: 'Timeline',
  rows: [
    { date: '11 SEPT', event: 'Applications open.' },
    { date: '26 SEPT', event: 'Applications close.' },
    {
      date: '26–29 SEPT',
      event:
        'Judging — teams balanced across the two live civic prizes;\nsubmissions reviewed for technical fit and feasibility.',
    },
    { date: '30 SEPT–2 OCT', event: 'Cohort announced.' },
    {
      date: '02 OCT–22 OCT',
      event:
        'Building, office hours run; prepare what can be built pre residency commences.',
    },
    {
      date: '23–31 OCT',
      event:
        'Residency — teams iterate and deliver; local piloting begins; usage tracked publicly.',
    },
    {
      date: '30 OCT',
      event:
        'Summit — functionality showcase, demo, impact review, vote, and awards.',
    },
    { date: '31 OCT', event: 'Check-out.' },
  ],
} as const

export const VENUE = {
  heading: 'About the Venue',
  image: {
    src: `${IMAGE_DIR}/venue.webp`,
    alt: 'The haveli at the Field Station venue in Rajasthan',
  },
  blocks: [
    {
      label: 'Dhun, Rajasthan',
      paragraphs: [
        'The venue is a 500-acre regenerative farm in Rajasthan, where Zu-Grama plans to build a permanent base of operations, located 60–90 mins from Jaipur International Airport.',
        'The stripped-back, intentional setting directly demonstrates what parallel organising looks like in practice, with farm-to-table food, boutique tents, and haveli accommodation. Expect shared meals, no phones at tables, wild food foraging, and co-preparing dishes alongside fellow residents.',
      ],
    },
    {
      label: 'Rooms',
      paragraphs: ['Shared rooms of 5–7 people (single-sex rooms)'],
    },
  ],
} as const

export const GATHERING: CardGridSection = {
  componentType: 'cardGrid',
  key: 'fieldStation.gathering',
  heading: 'A communal gathering',
  cards: [
    {
      title: 'Food',
      description:
        'Farm-to-table menu built around natively available crops, grains, and nuts. Dietary needs accommodated.\n\nDaily – 3 meals, 1 snack break, and soft drinks (included in your stay).',
      image: {
        src: `${IMAGE_DIR}/gathering-food.webp`,
        alt: 'Candlelit low tables set for dinner under the trees',
      },
    },
    {
      title: 'Evenings and shared lunches',
      description:
        'Communal meals and shared activities, phone-free.\n\nForaging experiences, lunches in the field, clay-and-coal dinners hosted within the grasslands, night observatory dinners.',
      image: {
        src: `${IMAGE_DIR}/gathering-evenings.webp`,
        alt: 'Residents gathered in the grasslands at dusk',
      },
    },
    {
      title: 'Travel',
      description:
        'For those requiring support with domestic travel costs, please indicate in the relevant question in the application form.',
      image: {
        src: `${IMAGE_DIR}/gathering-travel.webp`,
        alt: 'A lit entrance to guest accommodation among trees',
      },
    },
  ],
}

/**
 * Card captions and thumbnails are the ones in the Figma frame, which carries
 * them over from the /technology-stack use-case cards.
 */
const AGENDA_CAPTIONS = [
  {
    description:
      'Privacy-preserving blockchain for sovereign order and decentralised governance.',
    imageSrc: '/images/technology-stack/usecase-1.jpg',
  },
  {
    description:
      'Permanent, censorship-proof preservation of knowledge, culture, and history.',
    imageSrc: '/images/technology-stack/usecase-2.jpg',
  },
  {
    description:
      'Money that moves securely and freely, without surveillance or control.',
    imageSrc: '/images/technology-stack/usecase-3.jpg',
  },
  {
    description:
      'Self-organising groups can establish and enforce their own rules, with members engaging voluntarily.',
    imageSrc: '/images/technology-stack/usecase-4.jpg',
  },
] as const

const AGENDA_TITLES = [
  'Morning, breakfast, walk, meditation.',
  'Mid-morning stand up: What are you building? What’s blocking you?',
  'Mentoring rotation, drop-in sessions.',
  'Dedicated build time (4+ hours uninterrupted).',
  'Afternoon structured sessions: workshops, talks, demos.',
  'Evening: communal meal, walks, etc., no phones.',
  'Field note board: live and updated throughout, nodes running, etc.',
  'Exit gate: end of day stand up, every resident leaves each day with a next step.',
] as const

export const AGENDA = {
  heading: 'The daily agenda',
  cards: AGENDA_TITLES.map((title, index) => ({
    title,
    ...AGENDA_CAPTIONS[index % AGENDA_CAPTIONS.length],
    slot: index % AGENDA_CAPTIONS.length,
  })),
}

export const APPLY_BANNER: GiantSwitchSection = {
  componentType: 'giantSwitch',
  key: 'fieldStation.apply',
  accent: 'grey',
  imagePosition: 'left',
  title: 'Apply Now',
  description:
    'Basecamp is the launcher and unified surface of the Logos stack. It is an executable that wraps the Logos runtime, initialises the Logos Core environment, and discovers and loads plugins from installed modules.',
  image: {
    src: `${IMAGE_DIR}/apply.webp`,
    alt: 'Sunset over a lake',
    width: 1132,
    height: 1132,
  },
  primaryCta: {
    label: 'Install',
    href: EXTERNAL_URLS.basecampRelease,
    external: true,
    variant: 'secondary',
  },
}

export const PARTNERS = {
  logos: {
    title: 'About Logos',
    description:
      'Private messaging, storage, and blockchain infrastructure for civil society. Logos builds the sovereignty and privacy layer – the permissionless tools – for people running what they depend on.',
    image: { src: `${IMAGE_DIR}/about-logos.webp`, alt: '' },
  },
  zuGrama: {
    title: 'About Zu-Grama',
    description:
      'A pop-up village operator in the Zuzalu lineage, running end-to-end India operations from a permanent Bangalore node, Zu-Grama is an experiment in building pro-human places and pro-human technologies. Zu-Grama brings the local community, the venue, and the on-ground reach to Build the Parallel.',
    logo: {
      src: '/campaigns/field-station/zu-grama-logo.svg',
      alt: 'Zu-Grama',
      width: 106,
      height: 33,
    },
  },
} as const

export const FAQ = {
  heading: 'FAQ',
  // Placeholder copy from the Figma frame until the real questions land.
  items: [
    'Lorem ipsum dolor sit amet consectetur?',
    'consectetur Mauris tristique?',
    'Lorem ipsum dolor sit amet consectetur?',
    'consectetur Mauris tristique?',
    'Lorem ipsum dolor sit amet consectetur?',
    'consectetur Mauris tristique?',
    'Lorem ipsum dolor sit amet consectetur?',
    'consectetur Mauris tristique?',
  ].map((question, index) => ({
    key: `faq-${index}`,
    title: question,
    eventName: EVENT_NAMES.faqToggle(question),
    body: 'Aliquet arcu tempus ut consequat eu amet faucibus. Donec vitae nulla at tortor turpis viverra. Dui risus leo ut nec metus rhoncus massa. Fames sit mauris vel ut. Nulla cras consectetur mi venenatis consequat porttitor. Viverra sed convallis in venenatis tempor suspendisse magna sagittis.',
  })),
}
