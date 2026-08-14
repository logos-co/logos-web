import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import { reportQuerySchema } from '@/contracts/report'
import type { ActorContext } from '@/server/auth'
import {
  assignCase,
  createCase,
  updateCaseStatus,
} from '@/server/case-repository'
import { db } from '@/server/db'
import { caseWorkflowHistory, cases } from '@/server/db/schema'
import { recordDecision } from '@/server/evaluation-repository'
import { getFunnelReport } from '@/server/report-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

const DAY = 24 * 60 * 60 * 1000

function countFor(
  items: ReadonlyArray<{ key: string; count: number }>,
  key: string
): number {
  return items.find((item) => item.key === key)?.count ?? 0
}

describe.skipIf(!isIntegrationEnabled)('funnel report', () => {
  let actor: ActorContext
  let other: ActorContext
  let organisationId: string

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    other = await createTestUser('Jon Bell', 'jon.bell@logos.co')
    organisationId = await createTestOrganisation('Open Systems Lab')
  })

  function query(overrides: Partial<Record<string, string>> = {}) {
    return reportQuerySchema.parse({
      cohortFrom: new Date(Date.now() - 30 * DAY).toISOString(),
      cohortTo: new Date().toISOString(),
      asOf: new Date().toISOString(),
      timezone: 'UTC',
      bucket: 'day',
      ...overrides,
    })
  }

  async function openCase(title: string, ownerUserId?: string) {
    return createCase(actor, {
      title,
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [],
      ...(ownerUserId ? { ownerUserId } : {}),
    })
  }

  test('counts only cases created inside the cohort window', async () => {
    const inside = await openCase('Inside the window')
    const outside = await openCase('Outside the window')
    await db
      .update(cases)
      .set({ createdAt: new Date(Date.now() - 120 * DAY) })
      .where(eqId(outside.id))

    const report = await getFunnelReport(query())

    expect(report.cohortTotal).toBe(1)
    expect(inside.id).toBeTruthy()
  })

  test('reports the status the case was in at as_of, not its status now', async () => {
    const record = await openCase('Moved after the reporting moment')
    const asOf = new Date().toISOString()

    // Transition after as_of. The case is in_progress now, but at as_of it was
    // still new, and that is what the report must say.
    await new Promise((resolve) => setTimeout(resolve, 20))
    await updateCaseStatus(actor, record.id, {
      status: 'in_progress',
      expectedVersion: record.version,
    })

    const atThen = await getFunnelReport(query({ asOf }))
    const now = await getFunnelReport(query())

    expect(countFor(atThen.statusAtAsOf, 'new')).toBe(1)
    expect(countFor(atThen.statusAtAsOf, 'in_progress')).toBe(0)
    expect(countFor(now.statusAtAsOf, 'in_progress')).toBe(1)
  })

  test('lists every status even when nothing is in it', async () => {
    await openCase('Only case')

    const report = await getFunnelReport(query())

    expect(report.statusAtAsOf).toHaveLength(5)
    expect(countFor(report.statusAtAsOf, 'closed')).toBe(0)
  })

  test('attributes ownership to whoever held it at as_of', async () => {
    const record = await openCase('Handed over later', actor.userId)
    const asOf = new Date().toISOString()

    await new Promise((resolve) => setTimeout(resolve, 20))
    await assignCase(actor, record.id, other.userId, {
      expectedVersion: record.version,
    })

    const atThen = await getFunnelReport(query({ asOf }))
    const now = await getFunnelReport(query())

    expect(countFor(atThen.ownersAtAsOf, 'Mara Chen')).toBe(1)
    expect(countFor(now.ownersAtAsOf, 'Jon Bell')).toBe(1)
    expect(countFor(now.ownersAtAsOf, 'Mara Chen')).toBe(0)
  })

  test('gives unassigned cases their own bucket', async () => {
    await openCase('Nobody owns this')
    await openCase('Owned', actor.userId)

    const report = await getFunnelReport(query())

    expect(countFor(report.ownersAtAsOf, 'Unassigned')).toBe(1)
    expect(countFor(report.ownersAtAsOf, 'Mara Chen')).toBe(1)
  })

  test('breaks decisions down including the undecided', async () => {
    const decided = await openCase('Decided')
    await openCase('Still open')

    await recordDecision(actor, decided.id, {
      decision: 'approved',
      reason: 'Good fit.',
      expectedVersion: decided.version,
    })

    const report = await getFunnelReport(query())

    expect(countFor(report.decisions, 'approved')).toBe(1)
    expect(countFor(report.decisions, 'pending')).toBe(1)
    expect(countFor(report.decisions, 'declined')).toBe(0)
  })

  test('buckets intake by the requested timezone', async () => {
    const record = await openCase('Late evening in UTC')
    // 22:30 UTC on 10 June is already 11 June in Seoul (UTC+9).
    await db
      .update(cases)
      .set({ createdAt: new Date('2026-06-10T22:30:00.000Z') })
      .where(eqId(record.id))

    const utc = await getFunnelReport(
      query({
        cohortFrom: '2026-06-01T00:00:00.000Z',
        cohortTo: '2026-06-30T00:00:00.000Z',
        asOf: '2026-06-30T00:00:00.000Z',
        timezone: 'UTC',
      })
    )
    const seoul = await getFunnelReport(
      query({
        cohortFrom: '2026-06-01T00:00:00.000Z',
        cohortTo: '2026-06-30T00:00:00.000Z',
        asOf: '2026-06-30T00:00:00.000Z',
        timezone: 'Asia/Seoul',
      })
    )

    expect(utc.intakeOverTime[0]?.key).toBe('2026-06-10')
    expect(seoul.intakeOverTime[0]?.key).toBe('2026-06-11')
  })

  test('counts imported cases separately as a history coverage gap', async () => {
    const observed = await openCase('Observed history')
    const imported = await openCase('Imported history')
    await db
      .update(caseWorkflowHistory)
      .set({ source: 'import' })
      .where(eqCaseId(imported.id))

    const report = await getFunnelReport(query())

    expect(report.cohortTotal).toBe(2)
    expect(report.historyCoverageGap).toBe(1)
    expect(observed.id).toBeTruthy()
  })
})

function eqId(id: string) {
  return eq(cases.id, id)
}

function eqCaseId(id: string) {
  return eq(caseWorkflowHistory.caseId, id)
}
