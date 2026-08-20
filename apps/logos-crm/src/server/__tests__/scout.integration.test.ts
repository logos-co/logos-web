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
  scoutEvents,
  tasks,
} from '@/server/db/schema'
import { listCases } from '@/server/case-repository'
import { listOrganisations, listPeople } from '@/server/directory-repository'
import { search } from '@/server/search-repository'
import {
  findUndecidableCandidates,
  runDiscovery,
  runSyntheticDiscovery,
} from '@/server/scout-discovery'
import {
  getScoutCandidate,
  listScoutCandidates,
  recordScoutReview,
  recordScoutReviews,
  refreshScoutAssessment,
} from '@/server/scout-repository'
import { createScoutDiscoveryBrief } from '@/server/scout-brief-repository'

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
      field: 'ecosystem_relation',
      sourceUrl: 'https://specs.example/routing/participants',
      contentHash: 'synthetic:ecosystem_relation',
      value: 'Co-authors an open routing specification',
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

  test('requesting evidence creates actionable follow-up work and a metric', async () => {
    const candidateId = await createCandidate('Halcyon Relay Collective')
    await addEvidence(candidateId)

    const detail = await recordScoutReview(actor, candidateId, {
      decision: 'needs_evidence',
      reasonCategory: 'insufficient_evidence',
      reason: 'Confirm whether outsiders can contribute.',
      evidenceFields: ['contribution_path'],
    })

    expect(detail.evidenceRequests[0]).toMatchObject({
      fields: ['contribution_path'],
      note: 'Confirm whether outsiders can contribute.',
      status: 'open',
    })

    const events = await db
      .select()
      .from(scoutEvents)
      .where(eq(scoutEvents.candidateId, candidateId))
    expect(events.some((event) => event.eventType === 'review_recorded')).toBe(
      true
    )
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
      field: 'ecosystem_relation',
      sourceUrl: 'https://specs.example/routing/participants',
      contentHash: 'synthetic:ecosystem_relation',
      value: 'Co-authors an open routing specification',
    })

    const second = await refreshScoutAssessment(candidateId)

    expect(second.id).not.toBe(first.id)
    expect(first.gate).toBe('insufficient')
    expect(second.gate).toBe('sufficient')

    const detail = await getScoutCandidate(candidateId)
    expect(detail.assessment?.id).toBe(second.id)
  })

  test('two pages of one site do not clear the two-source gate', async () => {
    const candidateId = await createCandidate('Halcyon Relay Collective')
    await addEvidence(candidateId)
    await addEvidence(candidateId, {
      field: 'public_repository',
      sourceUrl: 'https://code.halcyonrelay.example/relay',
      contentHash: 'synthetic:public_repository',
      value: 'Public repository',
    })

    const assessment = await refreshScoutAssessment(candidateId)

    expect(assessment.distinctSources).toBe(1)
    expect(assessment.gate).toBe('insufficient')
  })

  test('the queue puts conflicts before candidates that are ready', async () => {
    const readyId = await createCandidate('Halcyon Relay Collective')
    await addEvidence(readyId)
    await addEvidence(readyId, {
      field: 'ecosystem_relation',
      sourceUrl: 'https://specs.example/routing/participants',
      contentHash: 'synthetic:ecosystem_relation',
      value: 'Co-authors an open routing specification',
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

describe.skipIf(!isIntegrationEnabled)(
  'scout discovery and bulk review',
  () => {
    let actor: ActorContext

    beforeEach(async () => {
      await resetDatabase()
      actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    })

    test('a run adds candidates from the catalogue and records what it did', async () => {
      const first = await runSyntheticDiscovery(actor)

      expect(first.discovered.length).toBeGreaterThan(0)
      expect(first.run.mode).toBe('synthetic')
      expect(first.run.discoveredCount).toBe(first.discovered.length)
      expect(first.run.note).toContain('No external source was contacted')

      const queue = await listScoutCandidates()
      expect(queue.length).toBe(first.discovered.length)

      // A second run continues the catalogue rather than repeating itself.
      const second = await runSyntheticDiscovery(actor)
      const names = new Set(
        (await listScoutCandidates()).map((item) => item.displayName)
      )
      expect(names.size).toBe(
        first.discovered.length + second.discovered.length
      )
    })

    test('a saved brief supplies and remains linked to a discovery run', async () => {
      const brief = await createScoutDiscoveryBrief(actor, {
        name: 'Open networking organisations',
        purpose: 'Find active organisations for a partnership review.',
        query: 'censorship resistant networking',
        organisationTypes: ['Open-source project'],
        themes: ['Networking'],
        exclusions: ['Personal repositories'],
        regions: [],
        activeWithinMonths: 12,
        sourceTypes: ['GitHub'],
      })

      const result = await runDiscovery(actor, {
        briefId: brief.id,
        mode: 'synthetic',
      })

      expect(result.run.briefId).toBe(brief.id)
      expect(result.run.note).toContain('synthetic')
    })

    test('a run exhausts the catalogue and says so rather than inventing more', async () => {
      let guard = 0
      let last = await runSyntheticDiscovery(actor)
      while (last.discovered.length > 0 && guard < 20) {
        last = await runSyntheticDiscovery(actor)
        guard += 1
      }

      expect(last.run.discoveredCount).toBe(0)
      expect(last.run.note).toContain('catalogue is exhausted')
    })

    test('discovery quarantines a person-named subject without storing evidence', async () => {
      let guard = 0
      let found = await runSyntheticDiscovery(actor)
      while (found.discovered.length > 0 && guard < 20) {
        if (found.run.quarantinedCount > 0) break
        found = await runSyntheticDiscovery(actor)
        guard += 1
      }

      const quarantined = await listScoutCandidates({ state: 'quarantined' })
      expect(quarantined.length).toBeGreaterThan(0)
      expect(quarantined[0]?.evidenceCount).toBe(0)
      expect(quarantined[0]?.assessment).toBeNull()
    })

    test('search matches the name, domain, and summary and nothing else', async () => {
      await runSyntheticDiscovery(actor)

      const all = await listScoutCandidates()
      const target = all[0]
      if (!target) throw new Error('The discovery run added nothing.')

      const byName = await listScoutCandidates({
        q: target.displayName.slice(0, 6),
      })
      expect(byName.map((item) => item.id)).toContain(target.id)

      // The excerpt of an evidence item is not searchable: that is where a
      // free-text query would start returning people named in a source.
      const byExcerpt = await listScoutCandidates({ q: 'pool hardware' })
      expect(byExcerpt).toHaveLength(0)
    })

    test('a bulk decision applies one reason to every selected candidate', async () => {
      await runSyntheticDiscovery(actor)
      const decidable = (await listScoutCandidates()).filter(
        (item) => item.reviewState === 'needs_review'
      )

      const result = await recordScoutReviews(actor, {
        candidateIds: decidable.map((item) => item.id),
        decision: 'watch',
        reason: 'Relevant enough to keep an eye on, not enough to act on.',
      })

      expect(result.decided).toBe(decidable.length)

      const watched = await listScoutCandidates({ state: 'watch' })
      expect(watched).toHaveLength(decidable.length)

      const detail = await getScoutCandidate(decidable[0]?.id ?? '')
      expect(detail.reviews[0]?.reason).toContain('keep an eye on')
    })

    test('undecidable candidates are named before a bulk decision runs', async () => {
      const quarantinedId = await createCandidate('Fenwick Media Lab', {
        entityType: 'unknown',
        reviewState: 'quarantined',
        quarantineReason: 'One person publishing under a studio name.',
      })
      const openId = await createCandidate('Halcyon Relay Collective')

      const blocked = await findUndecidableCandidates([quarantinedId, openId])
      expect(blocked).toEqual(['Fenwick Media Lab'])
    })
  }
)
