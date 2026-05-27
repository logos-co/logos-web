/**
 * Typed and validated server-side environment access.
 *
 * Reading `process.env.X` directly is risky: a typo silently widens an
 * `undefined` and downstream code makes the wrong choice (e.g. robots
 * marked `index: false` for production). This module validates env vars
 * once at import time and exposes a typed `env` object.
 *
 * Add new vars here, never reach into `process.env` from feature code.
 *
 * Kept dependency-free deliberately — `apps/web` doesn't ship zod, and
 * runtime env validation that has its own bug is worse than the inline
 * `process.env.X === '...'` it replaces.
 */

const NODE_ENV_VALUES = ['production', 'development', 'test'] as const
const API_MODE_VALUES = ['production', 'staging', 'development'] as const

type NodeEnv = (typeof NODE_ENV_VALUES)[number]
type ApiMode = (typeof API_MODE_VALUES)[number]

export type Env = {
  NODE_ENV: NodeEnv
  /**
   * Toggle for production-only behaviour gates (search-engine indexing,
   * analytics, etc.). Currently used by `lib/metadata.ts`.
   */
  NEXT_PUBLIC_API_MODE: ApiMode | undefined
  /**
   * Public site URL (e.g. `https://logos-co-web.vercel.app`). Used for
   * canonical, OG and Twitter absolute URLs. Set per environment.
   */
  NEXT_PUBLIC_SITE_URL: string | undefined
  /**
   * Public CMS origin (e.g. `https://cms.logos.co` or `http://localhost:3001`).
   * Optional — only required by features that read directly from the Payload
   * REST/GraphQL API at runtime (preview tokens, draft fetches). The default
   * content pipeline reads from local files, not this URL.
   */
  NEXT_PUBLIC_CMS_URL: string | undefined
  /**
   * Public calendar API origin used at build time for Logos Broadcast Network.
   */
  NEXT_PUBLIC_ADMIN_ACID_API_URL: string | undefined
  /**
   * Optional override for static forms that post directly to the take-action
   * service.
   */
  NEXT_PUBLIC_TAKE_ACTION_API_URL: string | undefined
}

function assertOneOf<T extends string>(
  raw: string | undefined,
  allowed: ReadonlyArray<T>,
  name: string,
  optional: false
): T
function assertOneOf<T extends string>(
  raw: string | undefined,
  allowed: ReadonlyArray<T>,
  name: string,
  optional: true
): T | undefined
function assertOneOf<T extends string>(
  raw: string | undefined,
  allowed: ReadonlyArray<T>,
  name: string,
  optional: boolean
): T | undefined {
  if (raw === undefined || raw === '') {
    if (optional) return undefined
    throw new Error(`${name} is required (one of: ${allowed.join(', ')})`)
  }
  if (!allowed.includes(raw as T)) {
    throw new Error(
      `${name}="${raw}" is invalid; must be one of: ${allowed.join(', ')}`
    )
  }
  return raw as T
}

function readOptionalString(raw: string | undefined): string | undefined {
  if (raw === undefined || raw === '') return undefined
  return raw
}

export const env: Env = {
  NODE_ENV:
    assertOneOf(process.env.NODE_ENV, NODE_ENV_VALUES, 'NODE_ENV', true) ??
    'development',
  NEXT_PUBLIC_API_MODE: assertOneOf(
    process.env.NEXT_PUBLIC_API_MODE,
    API_MODE_VALUES,
    'NEXT_PUBLIC_API_MODE',
    true
  ),
  NEXT_PUBLIC_SITE_URL: readOptionalString(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_CMS_URL: readOptionalString(process.env.NEXT_PUBLIC_CMS_URL),
  NEXT_PUBLIC_ADMIN_ACID_API_URL: readOptionalString(
    process.env.NEXT_PUBLIC_ADMIN_ACID_API_URL
  ),
  NEXT_PUBLIC_TAKE_ACTION_API_URL: readOptionalString(
    process.env.NEXT_PUBLIC_TAKE_ACTION_API_URL
  ),
}
