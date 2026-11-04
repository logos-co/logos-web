import { LOGOS_WEB_URL, siteEnvironment, strictConsole } from '@config/site'

import type { SiteRules } from '@fixtures/site.fixture'

/** Analytics endpoints answered locally so test runs are not counted. */
const BLOCKED_REQUESTS = [/umami\.bi\.status\.im/]

/**
 * Console errors that do not fail a test. Keep each entry commented; a known
 * site bug comes out of the list once it is fixed.
 */
const IGNORED_CONSOLE_ERRORS : RegExp[] = []

export const LOGOS_WEB_RULES: SiteRules = {
  blockedRequests: BLOCKED_REQUESTS,
  ignoredConsoleErrors: IGNORED_CONSOLE_ERRORS,
  strictConsole: strictConsole(LOGOS_WEB_URL),
  // nginx on dev.logos.co and logos.co rate-limits each IP; a fresh context
  // loads about 35 files, so one test every 3 s stays under the limit.
  testIntervalMs: siteEnvironment(LOGOS_WEB_URL) === 'local' ? 0 : 3_000,
}

/**
 * Pages every run opens. Each must answer 200 and render a non-empty `h1`;
 * page-specific checks live in their own spec.
 */
export const LOGOS_WEB_CORE_ROUTES = [
  '/',
  '/active-circles',
  '/basecamp',
  '/builders-hub',
  '/builders-hub/ideas',
  // RFPs moved from /builders-hub/rfps to /rfp on develop (#255); the old path
  // is now a redirect page. movement.spec covers both until logos.co ships it,
  // then add '/rfp' here.
  '/design-guide',
  '/field-guide',
  '/manifesto',
  '/media',
  '/media/articles',
  '/media/calendar',
  '/media/podcasts',
  '/movement',
  '/privacy-policy',
  '/research',
  '/roadmap',
  '/technology-stack',
  '/technology-stack/blockchain',
  '/technology-stack/messaging',
  '/technology-stack/networking',
  '/technology-stack/storage',
  '/terms-and-conditions',
  '/zines',
] as const

/**
 * apps/past-present-future is a separate SvelteKit app copied into the export,
 * so it gets its own list.
 */
export const PAST_PRESENT_FUTURE_ROUTES = [
  '/past-present-future',
  '/past-present-future/choices',
  '/past-present-future/museum-of-civil-liberties',
] as const

/**
 * Basecamp clients: what the browser reports through `navigator.userAgent`,
 * `navigator.platform` and `navigator.userAgentData` (`null` where the browser
 * has none), and the release asset the install button must link to. A `null`
 * asset means the "latest release" fallback page.
 */
export const BASECAMP_CLIENTS = [
  {
    name: 'macOS on Apple silicon',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    navigatorPlatform: 'MacIntel',
    userAgentData: { platform: 'macOS', architecture: 'arm' },
    asset: /-aarch64\.dmg$/,
  },
  {
    name: 'Windows on x64',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    navigatorPlatform: 'Win32',
    userAgentData: { platform: 'Windows', architecture: 'x86' },
    asset: /-x86_64-setup\.exe$/,
  },
  {
    name: 'Linux on x64',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    navigatorPlatform: 'Linux x86_64',
    userAgentData: { platform: 'Linux', architecture: 'x86' },
    asset: /-x86_64\.AppImage$/,
  },
  {
    name: 'Linux on arm64',
    userAgent:
      'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    navigatorPlatform: 'Linux aarch64',
    userAgentData: { platform: 'Linux', architecture: 'arm' },
    asset: /-aarch64\.AppImage$/,
  },
  {
    name: 'an iPhone',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    navigatorPlatform: 'iPhone',
    userAgentData: null,
    asset: null,
  },
] as const

export const BASECAMP_RELEASES =
  'https://github.com/logos-co/logos-basecamp/releases'
