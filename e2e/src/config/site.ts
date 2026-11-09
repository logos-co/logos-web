import dotenv from 'dotenv'
import path from 'node:path'

// Load e2e/.env.local, then e2e/.env, before any setting below is read. This has
// to happen here, not in the Playwright config: the config imports this module,
// and imports run before the config body. Variables already set in the shell
// win over both files.
const e2eDir = path.resolve(import.meta.dirname, '../..')
dotenv.config({ path: path.join(e2eDir, '.env.local'), quiet: true })
dotenv.config({ path: path.join(e2eDir, '.env'), quiet: true })

/**
 * Settings for the logos.co suite. It runs against a URL the caller provides:
 * `pnpm dev:web` or `pnpm --filter web start` on the developer's machine,
 * staging or production. Nothing here starts a server.
 */

/** Default target: both `pnpm dev:web` and `pnpm --filter web start` use 3000. */
export const LOGOS_WEB_URL =
  process.env.LOGOS_WEB_URL ?? 'http://localhost:3000'

/**
 * Header sent with every same-origin request, so a CDN or WAF in front of the
 * site can let the daily run through bot protection. Unset locally; CI reads
 * the value from the E2E_BYPASS_TOKEN secret.
 */
export const BYPASS_HEADER = 'x-e2e-bypass'
export const BYPASS_TOKEN = process.env.E2E_BYPASS_TOKEN ?? ''

/**
 * How many sitemap URLs the sitemap test requests: a number spread over the
 * whole sitemap, or `all` (CI). The default keeps a run against `next dev`
 * short, since each new route compiles.
 */
export const SITEMAP_SAMPLE = process.env.SITEMAP_SAMPLE ?? '30'

export type SiteEnvironment = 'production' | 'staging' | 'local'

/**
 * Production invites crawlers, every other deploy (dev.logos.co, Vercel
 * previews) shuts them out. A local build depends on its NEXT_PUBLIC_API_MODE,
 * so tests skip environment-specific checks there.
 */
export function siteEnvironment(baseURL: string): SiteEnvironment {
  const { hostname } = new URL(baseURL)
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'local'
  if (hostname === 'logos.co') return 'production'
  return 'staging'
}

/**
 * Whether `console.error` fails a test. On for remote targets, off for
 * localhost, where `next dev` logs development-only React warnings. Set
 * E2E_STRICT_CONSOLE=1 when testing the static export locally.
 */
export function strictConsole(baseURL: string): boolean {
  if (process.env.E2E_STRICT_CONSOLE) {
    return process.env.E2E_STRICT_CONSOLE === '1'
  }
  return siteEnvironment(baseURL) !== 'local'
}

/**
 * Token for the GitHub REST API, which the Basecamp test uses to look up the
 * latest release. Optional locally; CI passes the workflow's GITHUB_TOKEN.
 * Anonymous requests to github.com time out whenever GitHub sheds anonymous
 * traffic, and the anonymous API allows 60 requests an hour per IP.
 */
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? ''
