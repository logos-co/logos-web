import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { CaseRecord } from '@/contracts/case'
import type { ActorContext } from '@/server/auth'
import {
  createCase,
  listCases,
  updateCaseStage,
} from '@/server/case-repository'
import { db } from '@/server/db'
import { auditEvents, caseWorkflowHistory } from '@/server/db/schema'
import { ServiceError } from '@/server/service-errors'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

describe.skipIf(!isIntegrationEnabled)('case stage moves', () => {
  let actor: ActorContext
  let organisationId: string

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    organisationId = await createTestOrganisation('Cypherpunk Guild Berlin')
  })

  async function openCase(
    overrides: Partial<Parameters<typeof createCase>[1]> = {}
  ): Promise<CaseRecord> {
    return createCase(actor, {
      title: 'Waku integration for guild messaging',
      pipeline: 'ecodev',
      stage: 'lead',
      priority: 'high',
      organisationId,
      personIds: [],
      ...overrides,
    })
  }

  test('moves a case to another stage of its own pipeline', async () => {
    const record = await openCase()

    const moved = await updateCaseStage(actor, record.id, {
      stage: 'qualified',
      expectedVersion: record.version,
    })

    expect(moved.stage).toBe('qualified')
    expect(moved.pipeline).toBe('ecodev')
    expect(moved.version).toBe(record.version + 1)
  })

  test('leaves the status untouched', async () => {
    const record = await openCase()

    const moved = await updateCaseStage(actor, record.id, {
      stage: 'negotiation',
      expectedVersion: record.version,
    })

    expect(moved.status).toBe(record.status)
  })

  test('refuses a stage that belongs to the other pipeline', async () => {
    const record = await openCase()

    await expect(
      updateCaseStage(actor, record.id, {
        stage: 'training_call',
        expectedVersion: record.version,
      })
    ).rejects.toThrow(ServiceError)
  })

  test('refuses a stale version rather than overwriting a move it never saw', async () => {
    const record = await openCase()
    await updateCaseStage(actor, record.id, {
      stage: 'qualified',
      expectedVersion: record.version,
    })

    await expect(
      updateCaseStage(actor, record.id, {
        stage: 'negotiation',
        expectedVersion: record.version,
      })
    ).rejects.toThrow(ServiceError)
  })

  test('writes history and an audit event for the move', async () => {
    const record = await openCase()
    await updateCaseStage(actor, record.id, {
      stage: 'solution_eng',
      expectedVersion: record.version,
      reason: 'Technical discovery booked.',
    })

    const history = await db
      .select()
      .from(caseWorkflowHistory)
      .where(eq(caseWorkflowHistory.caseId, record.id))

    const move = history.find((row) => row.toStage === 'solution_eng')
    expect(move?.fromStage).toBe('lead')
    expect(move?.reason).toBe('Technical discovery booked.')

    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, record.id))

    const audited = events.find((row) => row.action === 'case.stage_changed')
    expect(audited).toBeDefined()
    // The audit trail carries labels, so a reader does not have to hold the
    // catalogue in their head to know what changed.
    expect(audited?.changes).toMatchObject({
      stage: { from: 'Lead', to: 'Solution Eng 👀' },
    })
  })

  test('a no-op move writes no history and does not bump the version', async () => {
    const record = await openCase()

    const moved = await updateCaseStage(actor, record.id, {
      stage: 'lead',
      expectedVersion: record.version,
    })

    expect(moved.version).toBe(record.version)

    const history = await db
      .select()
      .from(caseWorkflowHistory)
      .where(eq(caseWorkflowHistory.caseId, record.id))

    expect(history).toHaveLength(1)
  })

  test('refuses to create a case whose stage is not on its pipeline', async () => {
    await expect(
      openCase({ pipeline: 'movement', stage: 'negotiation' })
    ).rejects.toThrow(ServiceError)
  })

  test('lists only the cases on the requested pipeline', async () => {
    await openCase()
    await openCase({
      title: 'Logos Circles campus chapter',
      pipeline: 'movement',
      stage: 'training_call',
    })

    const ecodev = await listCases({ pipeline: 'ecodev' }, actor.userId)
    const movement = await listCases({ pipeline: 'movement' }, actor.userId)

    expect(ecodev.map((item) => item.title)).toEqual([
      'Waku integration for guild messaging',
    ])
    expect(movement.map((item) => item.title)).toEqual([
      'Logos Circles campus chapter',
    ])
  })

  test('finds a case by the stage label a user can actually see', async () => {
    await openCase({ stage: 'solution_eng' })

    const byLabel = await listCases({ q: 'Solution Eng' }, actor.userId)
    expect(byLabel.map((item) => item.title)).toEqual([
      'Waku integration for guild messaging',
    ])
  })
})
