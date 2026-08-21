import { eq, or } from 'drizzle-orm'

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
      .values(
        seed.evidence.map((item) => ({ ...item, candidateId: created.id }))
      )
  }

  // A quarantined candidate is never assessed: assessing it would mean reading
  // evidence that deliberately does not exist.
  if ((seed.reviewState ?? 'needs_review') !== 'quarantined') {
    await refreshScoutAssessment(created.id)
  }

  return created.id
}

export interface UpsertScoutCandidateResult {
  id: string
  created: boolean
  evidenceAdded: number
}

/** Adds new public evidence to an existing candidate instead of duplicating it. */
export async function upsertDiscoveredScoutCandidate(
  seed: Readonly<ScoutCandidateSeed>
): Promise<UpsertScoutCandidateResult> {
  const normalisedName = seed.displayName.toLocaleLowerCase('en')
  const [existing] = await db
    .select()
    .from(schema.scoutCandidates)
    .where(
      seed.domain
        ? or(
            eq(schema.scoutCandidates.normalisedName, normalisedName),
            eq(schema.scoutCandidates.domain, seed.domain)
          )
        : eq(schema.scoutCandidates.normalisedName, normalisedName)
    )
    .limit(1)

  if (!existing) {
    const id = await insertScoutCandidate(seed)
    if (!id) throw new Error('The discovered candidate was not stored.')
    return { id, created: true, evidenceAdded: seed.evidence.length }
  }

  if (existing.reviewState === 'quarantined') {
    return { id: existing.id, created: false, evidenceAdded: 0 }
  }

  const recorded = await db
    .select({ contentHash: schema.scoutEvidence.contentHash })
    .from(schema.scoutEvidence)
    .where(eq(schema.scoutEvidence.candidateId, existing.id))
  const hashes = new Set(recorded.map((item) => item.contentHash))
  const newEvidence = seed.evidence.filter(
    (item) => !hashes.has(item.contentHash)
  )

  if (newEvidence.length > 0) {
    await db.insert(schema.scoutEvidence).values(
      newEvidence.map((item) => ({
        ...item,
        candidateId: existing.id,
      }))
    )
  }

  await db
    .update(schema.scoutCandidates)
    .set({
      domain: existing.domain ?? seed.domain,
      summary: existing.summary ?? seed.summary,
      lastObservedAt: new Date(),
      updatedAt: new Date(),
      version: existing.version + 1,
    })
    .where(eq(schema.scoutCandidates.id, existing.id))

  if (newEvidence.length > 0) {
    await refreshScoutAssessment(existing.id)
  }

  return {
    id: existing.id,
    created: false,
    evidenceAdded: newEvidence.length,
  }
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
