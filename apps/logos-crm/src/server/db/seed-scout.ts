import { eq } from 'drizzle-orm'

import { refreshScoutAssessment } from '@/server/scout-repository'

import { db } from './index'
import * as schema from './schema'
import { seededCandidates, type ScoutCandidateSeed } from './scout-fixtures'

const DAY = 24 * 60 * 60 * 1000

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY)
}

/**
 * Writes one synthetic candidate and its evidence.
 *
 * Idempotent like the rest of the demo seed: candidates are keyed by their
 * normalised name, and evidence is written only for a candidate that has none.
 * Returns null when the candidate already existed, so a discovery run can
 * report what it actually added rather than what it attempted.
 */
export async function insertScoutCandidate(
  seed: Readonly<ScoutCandidateSeed>
): Promise<string | null> {
  const normalisedName = seed.displayName.toLocaleLowerCase('en')

  const inserted = await db
    .insert(schema.scoutCandidates)
    .values({
      displayName: seed.displayName,
      normalisedName,
      entityType: seed.entityType,
      domain: seed.domain,
      summary: seed.summary,
      reviewState: seed.reviewState ?? 'needs_review',
      quarantineReason: seed.quarantineReason ?? null,
      firstSeenAt: daysAgo(seed.firstSeenDaysAgo),
      lastObservedAt: daysAgo(seed.lastObservedDaysAgo),
    })
    .onConflictDoNothing()
    .returning({ id: schema.scoutCandidates.id })

  const [created] = inserted
  if (!created) return null

  if (seed.evidence.length > 0) {
    await db
      .insert(schema.scoutEvidence)
      .values(seed.evidence.map((item) => ({ ...item, candidateId: created.id })))
  }

  // A quarantined candidate is never assessed: assessing it would mean reading
  // evidence that deliberately does not exist.
  if ((seed.reviewState ?? 'needs_review') !== 'quarantined') {
    await refreshScoutAssessment(created.id)
  }

  return created.id
}

export async function seedScout(): Promise<void> {
  for (const seed of seededCandidates) {
    const created = await insertScoutCandidate(seed)
    if (created) continue

    // Re-running the seed against an existing demo database should still leave
    // an assessment behind if an earlier run was interrupted between the two.
    const [existing] = await db
      .select()
      .from(schema.scoutCandidates)
      .where(
        eq(
          schema.scoutCandidates.normalisedName,
          seed.displayName.toLocaleLowerCase('en')
        )
      )
      .limit(1)

    if (existing && existing.reviewState !== 'quarantined') {
      await refreshScoutAssessment(existing.id)
    }
  }
}
