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

  // Node Program
  nodeProgram: '/node-program',

  // Movement / Top-level nav
  movement: '/movement',
  book: '/book',
  links: '/links',

  // Press
  press: '/press',
  podcast: '/podcast',
  logosBroadcastNetwork: '/logos-broadcast-network',

  // About
  about: '/about',

  // Info / Help
  faq: '/faq',

  // Legal
  terms: '/terms-and-conditions',
  privacy: '/privacy-policy',
  security: '/security',

  // Footer misc
  workWithUs: '/work-with-us',
  brandKit: '/brand-kit',
  blog: '/blog',

  // Design system reference (internal)
  designSystems: '/design-systems',

  // Placeholder / test
  test: '/test',
} as const

// ---------------------------------------------------------------------------
// External URLs — third-party / social
// ---------------------------------------------------------------------------

export const EXTERNAL_URLS = {
  // Social
  twitter: 'https://twitter.com/logos_network',
  discord: 'https://discord.gg/logos',
  youtube: 'https://youtube.com/@logos_network',
  github: 'https://github.com/logos-co',

  // Forum
  forum: 'https://forum.logos.co/',
  docs: 'https://docs.logos.co',

  // Research
  vacp2p: 'https://vac.dev',

  // Infrastructure projects
  waku: 'https://waku.org',
  nimbus: 'https://nimbus.team',
  codex: 'https://codex.storage',
  nomos: 'https://nomos.tech',

  // Attribution
  ift: 'https://free.technology',
} as const

export type RouteKey = keyof typeof ROUTES
export type ExternalUrlKey = keyof typeof EXTERNAL_URLS
