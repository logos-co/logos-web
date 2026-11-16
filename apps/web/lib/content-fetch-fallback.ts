import { env } from './env'
import { logger } from './logger'

/**
 * The single rule for build-time content fetches (blog CMS media, active
 * circles): a failure fails the build, unless ALLOW_CONTENT_FETCH_FAILURE=1,
 * in which case the caller falls back to its committed snapshot.
 *
 * Call it from a `catch` block. It rethrows `error` when the switch is off
 * and logs the fallback when it is on.
 */
export function allowContentFetchFailure(label: string, error: unknown): void {
  if (!env.ALLOW_CONTENT_FETCH_FAILURE) throw error

  logger.warn(
    `${label} unavailable, using the committed snapshot (ALLOW_CONTENT_FETCH_FAILURE=1)`,
    { error: error instanceof Error ? error.message : String(error) }
  )
}
