import { sql } from 'drizzle-orm'

import { db, pool } from './index'
import { seedScout } from './seed-scout'

/**
 * Puts the Scout fixtures back to their starting state.
 *
 * Reviewing changes the queue, and discovery consumes the catalogue, so a demo
 * or a browser test run leaves it somewhere different from where it began.
 * This resets Scout and nothing else: the CRM tables it sits beside are
 * untouched, because re-running the full seed would duplicate the people and
 * cases that have no natural key.
 */
await db.execute(
  sql.raw(
    `truncate table scout_discovery_runs, scout_reviews, scout_assessments, scout_evidence, scout_candidates cascade`
  )
)

await seedScout()

process.stdout.write('Scout fixtures reset.\n')

await pool.end()
