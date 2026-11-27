import { env } from './env'
import { logger } from './logger'

/** A caller can keep its committed snapshot when its fallback switch is on. */
export function allowContentFetchFailure(
  label: string,
  error: unknown,
  sourceOverride?:
    | 'ALLOW_ACTIVE_CIRCLES_FETCH_FAILURE'
    | 'ALLOW_BROADCAST_EVENTS_FETCH_FAILURE'
): void {
  const flag =
    sourceOverride && env[sourceOverride]
      ? sourceOverride
      : 'ALLOW_CONTENT_FETCH_FAILURE'
  if (!env[flag]) throw error

  logger.warn(
    `${label} unavailable, using the committed snapshot (${flag}=1)`,
    {
      error: error instanceof Error ? error.message : String(error),
    }
  )
}
