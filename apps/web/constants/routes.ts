/**
 * Canonical site routes.
 *
 * Rule: every <a> tag, <Link> component, and href value across apps/web
 * MUST reference this file. Never hard-code path strings inline.
 * When adding a new page:
 *   1. Add the route here
 *   2. Update docs/pages.md with the Figma reference
 *   3. Update sitemap.ts
 */

// ---------------------------------------------------------------------------
// Internal routes — pages in apps/web
// ---------------------------------------------------------------------------

export const ROUTES = {
  // Home
  home: '/',

  // Technology Stack
  technologyStack: '/technology-stack',
  basecamp: '/basecamp',
  blockchain: '/technology-stack/blockchain',
  networking: '/technology-stack/networking',
  messaging: '/technology-stack/messaging',
  storage: '/technology-stack/storage',

  // Builders Hub
  getStarted: '/get-started',
  buildersHub: '/builders-hub',
  ideas: '/builders-hub/ideas',
  rfps: '/builders-hub/rfps',
  lambdaPrize: '/lambda-prize',

  // Circles
  circles: '/circles',
  activeCircles: '/active-circles',
  /** Dynamic route — `/circles/[slug]`. */
  circle: (slug: string) => `/circles/${slug}`,

  // Connect forms (CiviCRM intake)
  contact: '/contact',
  activistBuilder: '/activist-builder',
  activistLeaderSteward: '/activist-leader-steward',
  coalitionPartner: '/coalition-partner',

  // Node Programme
  nodeProgramme: '/node-programme',

  // Movement / Top-level nav
  movement: '/movement',
  book: '/book',

  // Blog (formerly "Logos Press Engine")
  blog: '/blog',
  podcast: '/podcast',
  logosBroadcastNetwork: '/logos-broadcast-network',

  // About
  about: '/about',

  // Research
  research: '/research',

  // Info / Help
  faq: '/faq',

  // Legal
  terms: '/terms-and-conditions',
  privacy: '/privacy-policy',
  security: '/security',

  // Footer misc
  brandKit: '/brand-kit',

  // Design system reference (internal)
  designSystems: '/design-systems',

  // Campaigns
  ukDebt: '/ukdebt',
} as const

// ---------------------------------------------------------------------------
// External URLs — third-party / social
// ---------------------------------------------------------------------------

export const EXTERNAL_URLS = {
  // Social
  twitter: 'https://twitter.com/logos_network',
  discord: 'https://discord.gg/logosnetwork',
  youtube: 'https://youtube.com/@logos_network',
  github: 'https://github.com/logos-co',

  // Forum
  forum: 'https://forum.logos.co/',
  forumMeetups: 'https://forum.logos.co/c/meetups/6',
  docs: 'https://github.com/logos-co/logos-docs',
  communityIdeas: 'https://github.com/logos-co/ideas',
  lambdaPrizes: 'https://github.com/logos-co/lambda-prize/tree/master/prizes',
  basecampRelease:
    'https://github.com/logos-co/logos-basecamp/releases/tag/0.1.2',
  basecampLinuxDownload:
    'https://github.com/logos-co/logos-basecamp/releases/download/0.1.2/LogosBasecamp-Desktop-v0.1.2-2576ef-aarch64.AppImage',
  basecampMacDownload:
    'https://github.com/logos-co/logos-basecamp/releases/download/0.1.2/LogosBasecamp-Desktop-v0.1.2-2576ef-aarch64.dmg',

  // Research
  vacp2p: 'https://vac.dev',
  researchSpecs: 'https://research.logos.co',
  researchForum: 'https://forum.research.logos.co/',
  researchDiscord: 'https://discord.gg/PQFdubGt6d',
  researchX: 'https://twitter.com/LogosRnD',
  vacGithub: 'https://github.com/vacp2p',
  vacJobs: 'https://jobs.status.im/?search=Vac',

  // Infrastructure projects
  waku: 'https://waku.org',
  nimbus: 'https://nimbus.team',
  codex: 'https://codex.storage',
  nomos: 'https://nomos.tech',

  // Attribution
  ift: 'https://free.technology',
  iftJobs: 'https://free.technology/jobs',
} as const

export type RouteKey = keyof typeof ROUTES
export type ExternalUrlKey = keyof typeof EXTERNAL_URLS
