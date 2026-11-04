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
