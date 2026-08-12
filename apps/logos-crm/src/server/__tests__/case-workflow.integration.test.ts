import { and, eq, isNull } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import {
  assignCase,
  createCase,
  updateCaseStatus,
} from '@/server/case-repository'
import { db } from '@/server/db'
import {
  auditEvents,
  caseAssignments,
  caseWorkflowHistory,
  cases,
} from '@/server/db/schema'
import { createActivity } from '@/server/work-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

describe.skipIf(!isIntegrationEnabled)('case workflow', () => {
  let actor: ActorContext
  let organisationId: string

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    organisationId = await createTestOrganisation('Open Systems Lab')
  })

  async function openCase(overrides: { ownerUserId?: string } = {}) {
    return createCase(actor, {
      title: 'Protocol research partnership',
      stage: 'Intake',
      priority: 'high',
      organisationId,
      personIds: [],
      ...overrides,
    })
  }

  test('creates a case that is unassigned and untriaged', async () => {
    const record = await openCase()

    expect(record.owner).toBeNull()
    expect(record.nextAction).toBeNull()
    expect(record.nextActionAt).toBeNull()
    expect(record.status).toBe('new')
    expect(record.organisationName).toBe('Open Systems Lab')
  })

  test('records the opening history row and audit event in one transaction', async () => {
    const record = await openCase()

    const history = await db
      .select()
      .from(caseWorkflowHistory)
      .where(eq(caseWorkflowHistory.caseId, record.id))
    const audit = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, record.id))

    expect(history).toHaveLength(1)
    expect(history[0]?.fromStatus).toBeNull()
    expect(history[0]?.toStatus).toBe('new')
    expect(audit).toHaveLength(1)
    expect(audit[0]?.action).toBe('case.created')
    expect(audit[0]?.actorUserId).toBe(actor.userId)
  })

  test('applies an allowed transition and appends history', async () => {
    const record = await openCase()

    const updated = await updateCaseStatus(actor, record.id, {
      status: 'in_progress',
      expectedVersion: record.version,
      reason: 'Coordinator picked it up',
    })

    expect(updated.status).toBe('in_progress')
    expect(updated.version).toBe(record.version + 1)

    const history = await db
      .select()
      .from(caseWorkflowHistory)
      .where(eq(caseWorkflowHistory.caseId, record.id))

    expect(history).toHaveLength(2)
    expect(history.at(-1)?.fromStatus).toBe('new')
    expect(history.at(-1)?.reason).toBe('Coordinator picked it up')
  })

  test('rejects a transition the state machine does not allow', async () => {
    const record = await openCase()

    await expect(
      updateCaseStatus(actor, record.id, {
        status: 'resolved',
        expectedVersion: record.version,
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })

    const [stored] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, record.id))
    expect(stored?.status).toBe('new')
  })

  test('leaves no history or audit rows behind when a transition is rejected', async () => {
    const record = await openCase()

    await expect(
      updateCaseStatus(actor, record.id, {
        status: 'resolved',
        expectedVersion: record.version,
      })
    ).rejects.toThrow()

    const history = await db
      .select()
      .from(caseWorkflowHistory)
      .where(eq(caseWorkflowHistory.caseId, record.id))
    const audit = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, record.id))

    expect(history).toHaveLength(1)
    expect(audit).toHaveLength(1)
  })

  test('rejects a stale edit with a conflict', async () => {
    const record = await openCase()
    await updateCaseStatus(actor, record.id, {
      status: 'in_progress',
      expectedVersion: record.version,
    })

    await expect(
      updateCaseStatus(actor, record.id, {
        status: 'waiting',
        expectedVersion: record.version,
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  test('keeps exactly one open assignment interval across reassignment', async () => {
    const other = await createTestUser('Jon Bell', 'jon.bell@logos.co')
    const record = await openCase({ ownerUserId: actor.userId })

    const updated = await assignCase(actor, record.id, other.userId, {
      expectedVersion: record.version,
      reason: 'Handover',
    })

    expect(updated.owner?.displayName).toBe('Jon Bell')

    const open = await db
      .select()
      .from(caseAssignments)
      .where(
        and(
          eq(caseAssignments.caseId, record.id),
          isNull(caseAssignments.validTo)
        )
      )
    const all = await db
      .select()
      .from(caseAssignments)
      .where(eq(caseAssignments.caseId, record.id))

    expect(open).toHaveLength(1)
    expect(open[0]?.ownerUserId).toBe(other.userId)
    expect(all).toHaveLength(2)
  })
})

describe.skipIf(!isIntegrationEnabled)('contact tracking', () => {
  let actor: ActorContext
  let organisationId: string

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    organisationId = await createTestOrganisation('Open Systems Lab')
  })

  async function openCase() {
    return createCase(actor, {
      title: 'Community node programme',
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [],
    })
  }

  test('a note does not count as contact', async () => {
    const record = await openCase()

    await createActivity(actor, {
      subjectType: 'case',
      subjectId: record.id,
      type: 'note',
      body: 'Background reading on their protocol work.',
    })

    const [stored] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, record.id))
    expect(stored?.lastContactAt).toBeNull()
  })

  test('a call advances the contact cache', async () => {
    const record = await openCase()
    const occurredAt = new Date('2026-08-01T10:00:00.000Z')

    await createActivity(actor, {
      subjectType: 'case',
      subjectId: record.id,
      type: 'call',
      body: 'Intro call with the research lead.',
      occurredAt: occurredAt.toISOString(),
    })

    const [stored] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, record.id))
    expect(stored?.lastContactAt?.toISOString()).toBe(occurredAt.toISOString())
  })

  test('an older contact does not move the cache backwards', async () => {
    const record = await openCase()
    const recent = new Date('2026-08-05T10:00:00.000Z')
    const older = new Date('2026-07-01T10:00:00.000Z')

    await createActivity(actor, {
      subjectType: 'case',
      subjectId: record.id,
      type: 'meeting',
      body: 'Recent meeting.',
      occurredAt: recent.toISOString(),
    })
    await createActivity(actor, {
      subjectType: 'case',
      subjectId: record.id,
      type: 'email',
      body: 'Backfilled older email.',
      occurredAt: older.toISOString(),
    })

    const [stored] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, record.id))
    expect(stored?.lastContactAt?.toISOString()).toBe(recent.toISOString())
  })
})
