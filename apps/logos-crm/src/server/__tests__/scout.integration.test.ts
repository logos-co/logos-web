import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import {
  auditEvents,
  cases,
  organisations,
  people,
  scoutCandidates,
  scoutEvidence,
  tasks,
} from '@/server/db/schema'
import { listCases } from '@/server/case-repository'
import { listOrganisations, listPeople } from '@/server/directory-repository'
import { search } from '@/server/search-repository'
import {
  getScoutCandidate,
  listScoutCandidates,
  recordScoutReview,
  refreshScoutAssessment,
} from '@/server/scout-repository'

import {
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

const DAY = 24 * 60 * 60 * 1000

async function createCandidate(
  displayName: string,
  overrides: Partial<typeof scoutCandidates.$inferInsert> = {}
): Promise<string> {
  const [row] = await db
    .insert(scoutCandidates)
    .values({
      displayName,
      normalisedName: displayName.toLocaleLowerCase('en'),
      entityType: 'organisation',
      domain: `${displayName.replace(/\s+/g, '').toLocaleLowerCase('en')}.example`,
      summary: 'Synthetic fixture.',
      ...overrides,
    })
    .returning()

  if (!row) throw new Error('The candidate was not created.')
  return row.id
}

async function addEvidence(
  candidateId: string,
  overrides: Partial<typeof scoutEvidence.$inferInsert> = {}
): Promise<void> {
  await db.insert(scoutEvidence).values({
    candidateId,
    field: 'theme_match',
    value: 'Censorship-resistant messaging',
    sourceUrl: 'https://halcyonrelay.example/about',
    sourceTitle: 'About',
    contentHash: 'synthetic:theme_match',
    excerpt: 'We build metadata-resistant message routing.',
    extractionMethod: 'synthetic',
    extractorVersion: 'synthetic-fixture-v1',
    certainty: 'exact',
    expiresAt: new Date(Date.now() + 90 * DAY),
    ...overrides,
  })
}

describe.skipIf(!isIntegrationEnabled)('scout', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
  })

  test('the database refuses evidence carrying a personal contact detail', async () => {
    const candidateId = await createCandidate('Halcyon Relay Collective')

    await expect(
      addEvidence(candidateId, {
        field: 'contribution_path',
        value: 'Write to maintainer at relay.person@halcyonrelay.example',
      })
    ).rejects.toThrow()

    await expect(
      addEvidence(candidateId, {
        field: 'contribution_path',
        value: 'Call the coordinator on +44 20 7946 0958',
      })
    ).rejects.toThrow()

    const stored = await db
      .select()
      .from(scoutEvidence)
      .where(eq(scoutEvidence.candidateId, candidateId))

    expect(stored).toHaveLength(0)
  })

  test('a candidate is invisible to CRM search, directories, and cases', async () => {
    const candidateId = await createCandidate('Halcyon Relay Collective')
    await addEvidence(candidateId)
    await refreshScoutAssessment(candidateId)

    const hits = await search('Halcyon')
    expect(hits.cases).toHaveLength(0)
    expect(hits.organisations).toHaveLength(0)
    expect(hits.people).toHaveLength(0)

    expect(await listOrganisations()).toHaveLength(0)
    expect(await listPeople()).toHaveLength(0)
    expect(await listCases({})).toHaveLength(0)
  })

  test('accepting a candidate creates nothing in the CRM', async () => {
    const candidateId = await createCandidate('Halcyon Relay Collective')
    await addEvidence(candidateId)
    await addEvidence(candidateId, {
      field: 'official_site',
      sourceUrl: 'https://halcyonrelay.example/',
      contentHash: 'synthetic:official_site',
      value: 'halcyonrelay.example',
    })

    const detail = await recordScoutReview(actor, candidateId, {
      decision: 'accept',
      reason: 'Clear overlap with the messaging theme.',
    })

    expect(detail.reviewState).toBe('accepted')
    expect(detail.reviews).toHaveLength(1)
    expect(detail.reviews[0]?.reviewer?.displayName).toBe('Mara Chen')

    // The boundary the plan describes, asserted rather than promised.
    expect(await db.select().from(organisations)).toHaveLength(0)
    expect(await db.select().from(people)).toHaveLength(0)
    expect(await db.select().from(cases)).toHaveLength(0)
    expect(await db.select().from(tasks)).toHaveLength(0)

    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, candidateId))

    expect(events).toHaveLength(1)
    expect(events[0]?.action).toBe('scout.candidate.accept')
    expect(events[0]?.actorUserId).toBe(actor.userId)
  })

  test('an accepted candidate cannot be reviewed again', async () => {
    const candidateId = await createCandidate('Halcyon Relay Collective')
    await addEvidence(candidateId)

    await recordScoutReview(actor, candidateId, {
      decision: 'accept',
      reason: 'Worth pursuing.',
    })

    await expect(
      recordScoutReview(actor, candidateId, {
        decision: 'reject',
        reason: 'Changed my mind.',
      })
    ).rejects.toThrow(/new assessment/)
  })

  test('a quarantined candidate cannot be reviewed at all', async () => {
    const candidateId = await createCandidate('Sole Practitioner Consultancy', {
      entityType: 'unknown',
      reviewState: 'quarantined',
      quarantineReason: 'The subject resolved to one named individual.',
    })

    await expect(
      recordScoutReview(actor, candidateId, {
        decision: 'accept',
        reason: 'Looks fine to me.',
      })
    ).rejects.toThrow(/quarantined/)
  })

  test('a review supersedes the previous assessment rather than editing it', async () => {
    const candidateId = await createCandidate('Halcyon Relay Collective')
    await addEvidence(candidateId)

    const first = await refreshScoutAssessment(candidateId)

    await addEvidence(candidateId, {
      field: 'official_site',
      sourceUrl: 'https://halcyonrelay.example/',
      contentHash: 'synthetic:official_site',
      value: 'halcyonrelay.example',
    })

    const second = await refreshScoutAssessment(candidateId)

    expect(second.id).not.toBe(first.id)
    expect(first.gate).toBe('insufficient')
    expect(second.gate).toBe('sufficient')

    const detail = await getScoutCandidate(candidateId)
    expect(detail.assessment?.id).toBe(second.id)
  })

  test('the queue puts conflicts before candidates that are ready', async () => {
    const readyId = await createCandidate('Halcyon Relay Collective')
    await addEvidence(readyId)
    await addEvidence(readyId, {
      field: 'official_site',
      sourceUrl: 'https://halcyonrelay.example/',
      contentHash: 'synthetic:official_site',
      value: 'halcyonrelay.example',
    })
    await refreshScoutAssessment(readyId)

    const conflictedId = await createCandidate('Quorum Field')
    await addEvidence(conflictedId, {
      field: 'governance_model',
      value: 'Registered cooperative',
      sourceUrl: 'https://quorumfield.example/about',
      contentHash: 'synthetic:governance:a',
    })
    await addEvidence(conflictedId, {
      field: 'governance_model',
      value: 'Private company limited by shares',
      sourceUrl: 'https://registry.example/quorum-field',
      contentHash: 'synthetic:governance:b',
    })
    await refreshScoutAssessment(conflictedId)

    const queue = await listScoutCandidates()

    expect(queue[0]?.id).toBe(conflictedId)
    expect(queue[0]?.assessment?.gate).toBe('conflicted')
    expect(queue[1]?.id).toBe(readyId)
  })
})
