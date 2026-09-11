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

import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

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
  trackToggle: (title: string) => `Track - ${title}`,
  trackLink: (title: string) => `Problem statements - ${title}`,
  faqToggle: (question: string) => `FAQ - ${question}`,
  faqLink: (label: string) => `FAQ link - ${label}`,
  partnerLogos: 'Logos homepage - Partners',
  partnerZuGrama: 'Zu-Grama website - Partners',
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
  heading: 'About the Program',
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

/** A panel paragraph; `heading` runs in bold straight into the text. */
export interface TrackBlock {
  heading?: string
  text: string
  /** Words in `text` that link out once `href` is set. */
  link?: { label: string; href?: string; eventName: string }
}

/**
 * Problem statement docs for each track. The copy is live; the "here" links
 * switch on as soon as a URL lands here.
 */
const PROBLEM_STATEMENTS_HREF: Record<
  'civicPrize' | 'sovereigntyPrivacy' | 'zuGramaDacc',
  string | undefined
> = {
  civicPrize: undefined,
  sovereigntyPrivacy: undefined,
  zuGramaDacc: undefined,
}

const problemStatementsLink = (
  track: keyof typeof PROBLEM_STATEMENTS_HREF,
  title: string
) => ({
  label: 'here',
  href: PROBLEM_STATEMENTS_HREF[track],
  eventName: EVENT_NAMES.trackLink(title),
})

export const TRACKS = {
  heading: 'The Tracks',
  items: [
    {
      key: 'civic-prize',
      title: 'Logos Civic Prize',
      subtitle: 'Tools to rebuild civil society',
      details: [
        {
          text: 'Develop the tools to rebuild civil society. Two live civic prizes defined by Logos Circles – real people ideating solutions to real-world issues. Build your own creative version of one of the ideas listed below:',
        },
        {
          heading: 'Civic reporting and community response',
          text: "If something breaks on the farm, in the village, or within surrounding communities, such as a water issue, a waste problem, blocked access, or something needing maintenance, there's no shared way to report it and track what happens next.",
        },
        {
          text: "Within this track, you'd build the tool that fixes that: someone reports a problem, it gets tracked, and everyone can see its status change from reported to in-progress to resolved.",
        },
        {
          text: 'This kind of tool can lean on the full Logos stack: Messaging to notify people, Storage for evidence, and Blockchain to keep the status history tamper proof.',
        },
        {
          heading: 'Privacy-preserving mutual aid coordination',
          text: 'Residents and site staff constantly need things from each other: a ride into Jaipur, a spare part, or someone who can fix a bike. Within this track, an example of something you could build would be a simple offers-and-requests board that matches people. This kind of tool can again lean on the full Logos stack.',
        },
        {
          text: 'See more problem statements here.',
          link: problemStatementsLink('civicPrize', 'Logos Civic Prize'),
        },
      ],
    },
    {
      key: 'sovereignty-privacy',
      title: 'Logos Sovereignty and Privacy',
      subtitle: 'Bring your own idea',
      // Figma gives this caption a 234px box, wider than the text.
      subtitleClassName: 'sm:inline-block sm:min-w-[234px]',
      details: [
        {
          text: 'Already have a live project designed to enable sovereignty through privacy? Bring your work in progress and refine it with the Logos private-by-default tech stack',
        },
        {
          text: "This is the track for builders who want to work directly on Logos. If you are already building something that puts privacy and sovereignty into people's hands, or have an idea in this field, this track is for you. A tool, an app, or a protocol designed around the idea that people should own their own data and infrastructure rather than rent it from someone else. You can start with an idea, or apply with something already a work in progress.",
        },
        {
          text: 'You can also think of other tools that are relevant to your city, community, or Dhun and Jaipur.',
        },
        {
          text: 'Finally, you can build towards one of the prizes in the standing λPrize catalogue, which funds core ecosystem primitives and runs in parallel to the residency under its own normal rules.',
        },
        {
          text: 'See more problem statements here.',
          link: problemStatementsLink(
            'sovereigntyPrivacy',
            'Logos Sovereignty and Privacy'
          ),
        },
      ],
    },
    {
      key: 'zu-grama-dacc',
      title: 'Zu-Grama d/acc\n(decentralised acceleration)',
      subtitle: 'AI, neurotech, bio-resilience',
      details: [
        {
          text: 'AI, neurotech, bio-resilience – the Zu-Grama-led track intersects with the Logos stack (where possible, not essential) at the AI × cryptography × sovereignty junction.',
        },
        {
          text: 'This is for people building technologies that preserve human agency in a world shaped by increasingly powerful AI, biology and digital systems. We are especially looking for researchers and builders working on AI alignment, AI for science, Biotech, Neurotech, sense-making, civic tech, privacy and d/acc-aligned infrastructure. We’ll prioritise applicants with a serious question, project, or experiment they want to push forward during the residency, and who would benefit from working closely with others across these fields.',
        },
        {
          text: 'We are also particularly interested in solutions that might help India across health, sense-making tools, etc.',
        },
        {
          text: 'For a list of problem statements, please see here.',
          link: problemStatementsLink(
            'zuGramaDacc',
            'Zu-Grama d/acc (decentralised acceleration)'
          ),
        },
      ],
    },
    {
      key: 'resident',
      title: 'Resident, non-builder',
      subtitle: 'Join as an activist, community organiser, artist',
      details: [
        {
          text: 'Join as an activist, cultural or community organiser, user, artist, writer, tester, or voter rather than to ship code or products. This track is for those who want to explore and help with dogfooding tools.',
        },
        {
          text: 'Not everyone at Field Station is writing code. This track is for the people who make a builder residency work by using, testing, and judging what gets built rather than building it themselves.',
        },
        {
          text: "For example, civic reporting and mutual aid only prove themselves useful if someone outside the build team actually uses them on site, or back at home in their local community. Whether you're drawn by the ideals of sovereign infrastructure or have an interest in AI and bio-resilience, that's enough to apply.",
        },
        {
          text: "You apply to this track as one of three things: artist, writer, or explorer. As an artist, you bring the residency's cultural dimension, music, painting, farming, whatever your practice is, into a space that's otherwise all whiteboards and terminals. As a writer, your job is to document what's actually happening, honest accounts of what a parallel society looks like when people try to live inside one. And as an explorer you don't need a fixed role at all, just a problem you can't stop thinking about, explained in plain language, and an honest answer to what you're actually doing about it, whether that's a live experiment, volunteering, a half-built prototype, a dataset, a paper, or just a clear idea of the first thing you'd try.",
        },
      ],
    },
  ],
} as const satisfies {
  heading: string
  items: readonly {
    key: string
    title: string
    subtitle: string
    subtitleClassName?: string
    details: readonly TrackBlock[]
  }[]
}

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
    href: ROUTES.home,
    description:
      'Private messaging, storage, and blockchain infrastructure for civil society. Logos builds the sovereignty and privacy layer – the permissionless tools – for people running what they depend on.',
    image: { src: `${IMAGE_DIR}/about-logos.webp`, alt: '' },
  },
  zuGrama: {
    title: 'About Zu-Grama',
    href: 'https://zugrama.org/',
    description:
      'ZuGrama is an experiment in building pro-human places and pro-human technology. Our north star is a permanent village where people live, build and test technologies that preserve human agency. We are working toward this through residencies, pop-up villages and community events, with a base in Bangalore and programmes across India and elsewhere.',
    logo: {
      src: '/campaigns/field-station/zu-grama-logo.svg',
      alt: 'Zu-Grama',
      width: 106,
      height: 33,
    },
  },
} as const

export interface FaqLink {
  label: string
  href: string
}

/**
 * An answer paragraph, or a run of links set one per line. `link.label` is
 * the part of `text` that links.
 */
export type FaqBlock = { text: string; link?: FaqLink } | { links: FaqLink[] }

const BASECAMP_INSTALL_DOCS =
  'https://docs.logos.co/basecamp/install-logos-basecamp'
const RUN_A_NODE_DOCS = 'https://docs.logos.co/run-a-node'

const faqItem = (question: string, answer: FaqBlock[]) => ({
  key: question,
  title: question,
  eventName: EVENT_NAMES.faqToggle(question),
  answer,
})

export const FAQ = {
  heading: 'FAQ',
  items: [
    faqItem('How do I install Basecamp?', [
      {
        text: 'Go to logos.co/basecamp and install either the Linux version or Mac version.',
        link: { label: 'logos.co/basecamp', href: ROUTES.basecamp },
      },
      {
        links: [
          {
            label: 'docs.logos.co/basecamp/install-logos-basecamp',
            href: BASECAMP_INSTALL_DOCS,
          },
          {
            label: 'Installing Logos Basecamp',
            href: 'https://www.youtube.com/watch?v=SZ72xolkZz4',
          },
          {
            label: 'Quickstart Logos Basecamp',
            href: 'https://www.youtube.com/watch?v=EwCkegIm_1o',
          },
          { label: 'Latest release', href: EXTERNAL_URLS.basecampRelease },
        ],
      },
    ]),
    faqItem('How do I run a node?', [
      {
        links: [
          { label: 'docs.logos.co/run-a-node', href: RUN_A_NODE_DOCS },
          {
            label: 'How to Run a Logos Blockchain Node with Docker',
            href: 'https://www.youtube.com/watch?v=yWtu2O1TlJg',
          },
        ],
      },
    ]),
    faqItem('Do I need to be a developer?', [
      {
        text: 'No. About 30 residents take part from mixed backgrounds. Some ship software. Others use it, test it, and vote for winning submissions.',
      },
    ]),
    faqItem('Do I need a working prototype?', [
      {
        text: 'No, but if you have one, link it. It will prioritise your application.',
      },
    ]),
    faqItem("What's Basecamp, and do I need it?", [
      {
        text: 'Basecamp is a local-first launcher for the Logos stack and is used to run a Logos node. Installing it, and where applicable, running a node, is required for an application to be successful.',
      },
    ]),
    faqItem("What's the accommodation like?", [
      {
        text: 'Shared rooms, 5–7 people, single-sex. Farm-to-table food, boutique tents, and haveli lodgings on site.',
      },
    ]),
    faqItem('Is there a code of conduct?', [
      {
        text: 'Yes. Phone-free communal evenings, a shared field-note board visible to the group, and a code of conduct governing how residents interact with the venue, staff, and one another.',
      },
    ]),
    faqItem('What does it cost?', [
      {
        text: '25 - 30 residents will have accommodation, food, and beverages provided for them.',
      },
      {
        text: 'Local travel support details are provided within the application form. No international flights will be compensated.',
      },
      {
        text: 'In the coming weeks, we will post options for paid guests on site during the last four days of the residency.',
      },
    ]),
    faqItem('How do I get from Jaipur to Dhun?', [
      {
        text: 'We will share details regarding transfer from Jaipur to Dhun to selected residents',
      },
    ]),
    faqItem('Which is the nearest airport to Dhun?', [
      { text: 'Jaipur International Airport' },
    ]),
  ],
}
