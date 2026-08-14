import type { Task } from 'graphile-worker'

import { expireIntakePayloads } from '@/server/privacy-repository'

/**
 * Retention for the stored funnel payloads.
 *
 * A schedule rather than a manual command, because retention that depends on
 * somebody remembering is not retention. It only clears payloads whose records
 * already exist, so an unprocessed submission is never the thing that expires.
 */
export const expireIntakePayloadsTask: Task = async (_payload, helpers) => {
  const cleared = await expireIntakePayloads(`job:${helpers.job.id}`)
  if (cleared > 0) {
    helpers.logger.info(`Cleared ${cleared} expired intake payloads.`)
  }
}
