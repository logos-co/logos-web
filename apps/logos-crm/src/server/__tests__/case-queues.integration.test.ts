import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import {
  assignCase,
  countCasesByQueue,
  createCase,
  listCases,
  STALE_AFTER_DAYS,
  updateCaseStatus,
} from '@/server/case-repository'
import { db } from '@/server/db'
import { cases, tasks } from '@/server/db/schema'
import {
  createActivity,
  createTask,
  updateTask,
} from '@/server/work-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

const DAY = 24 * 60 * 60 * 1000

describe.skipIf(!isIntegrationEnabled)('case queues', () => {
  let actor: ActorContext
  let other: ActorContext
  let organisationId: string

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    other = await createTestUser('Jon Bell', 'jon.bell@logos.co')
    organisationId = await createTestOrganisation('Open Systems Lab')
  })

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

  async function addTask(caseId: string, dueAt: Date, assignee?: string) {
    return createTask(actor, {
      subjectType: 'case',
      subjectId: caseId,
      title: 'Follow up',
      priority: 'medium',
      dueAt: dueAt.toISOString(),
      ...(assignee ? { assigneeUserId: assignee } : {}),
    })
  }

  test('mine returns only cases owned by the acting user', async () => {
    const own = await openCase('Owned by me', actor.userId)
    await openCase('Owned by someone else', other.userId)
    await openCase('Owned by nobody')

    const items = await listCases({ queue: 'mine' }, actor.userId)

    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe(own.id)
  })

  test('mine returns nothing rather than everything without an actor', async () => {
    await openCase('Owned by me', actor.userId)

    const items = await listCases({ queue: 'mine' }, null)

    expect(items).toHaveLength(0)
  })

  test('unassigned excludes closed cases', async () => {
    const open = await openCase('Waiting for an owner')
    const closed = await openCase('Closed without an owner')
    await updateCaseStatus(actor, closed.id, {
      status: 'closed',
      expectedVersion: closed.version,
    })

    const items = await listCases({ queue: 'unassigned' }, actor.userId)

    expect(items.map((item) => item.id)).toEqual([open.id])
  })

  test('a case leaves unassigned as soon as it is assigned', async () => {
    const record = await openCase('Needs an owner')
    expect(await listCases({ queue: 'unassigned' }, actor.userId)).toHaveLength(
      1
    )

    await assignCase(actor, record.id, other.userId, {
      expectedVersion: record.version,
    })

    expect(await listCases({ queue: 'unassigned' }, actor.userId)).toHaveLength(
      0
    )
  })

  test('overdue is driven by open tasks, not by the case', async () => {
    const overdue = await openCase('Has an overdue task', actor.userId)
    const upcoming = await openCase('Has a future task', actor.userId)
    await addTask(overdue.id, new Date(Date.now() - DAY))
    await addTask(upcoming.id, new Date(Date.now() + DAY))

    const items = await listCases({ queue: 'overdue' }, actor.userId)

    expect(items.map((item) => item.id)).toEqual([overdue.id])
  })

  test('completing the task clears the case from overdue', async () => {
    const record = await openCase('Has an overdue task', actor.userId)
    const task = await addTask(record.id, new Date(Date.now() - DAY))

    expect(await listCases({ queue: 'overdue' }, actor.userId)).toHaveLength(1)

    await updateTask(actor, task.id, { status: 'completed' })

    expect(await listCases({ queue: 'overdue' }, actor.userId)).toHaveLength(0)
  })

  test('stale catches a case that has notes but no contact', async () => {
    const record = await openCase('Plenty of notes, no contact', actor.userId)
    await createActivity(actor, {
      subjectType: 'case',
      subjectId: record.id,
      type: 'note',
      body: 'Reading their proposal.',
    })

    const items = await listCases({ queue: 'stale' }, actor.userId)

    expect(items.map((item) => item.id)).toContain(record.id)
  })

  test('recent contact takes a case out of stale', async () => {
    const record = await openCase('Recently contacted', actor.userId)
    await createActivity(actor, {
      subjectType: 'case',
      subjectId: record.id,
      type: 'call',
      body: 'Spoke this morning.',
    })

    const items = await listCases({ queue: 'stale' }, actor.userId)

    expect(items.map((item) => item.id)).not.toContain(record.id)
  })

  test('contact older than the threshold is stale again', async () => {
    const record = await openCase('Contacted long ago', actor.userId)
    await db
      .update(cases)
      .set({
        lastContactAt: new Date(Date.now() - (STALE_AFTER_DAYS + 1) * DAY),
      })
      .where(eq(cases.id, record.id))

    const items = await listCases({ queue: 'stale' }, actor.userId)

    expect(items.map((item) => item.id)).toContain(record.id)
  })

  test('needs_triage holds only new cases', async () => {
    const fresh = await openCase('Just arrived')
    const started = await openCase('Already moving', actor.userId)
    await updateCaseStatus(actor, started.id, {
      status: 'in_progress',
      expectedVersion: started.version,
    })

    const items = await listCases({ queue: 'needs_triage' }, actor.userId)

    expect(items.map((item) => item.id)).toEqual([fresh.id])
  })

  test('queue counts agree with the lists they label', async () => {
    const mine = await openCase('Mine', actor.userId)
    await openCase('Unassigned')
    await addTask(mine.id, new Date(Date.now() - DAY))

    const counts = await countCasesByQueue(actor.userId)

    expect(counts.all).toBe(2)
    expect(counts.mine).toBe(1)
    expect(counts.unassigned).toBe(1)
    expect(counts.overdue).toBe(1)
    expect(counts.needs_triage).toBe(2)
  })
})

describe.skipIf(!isIntegrationEnabled)('next action', () => {
  let actor: ActorContext
  let organisationId: string

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    organisationId = await createTestOrganisation('Open Systems Lab')
  })

  async function openCase() {
    return createCase(actor, {
      title: 'Protocol research partnership',
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [],
    })
  }

  test('reports the earliest open task as the next action', async () => {
    const record = await openCase()
    await createTask(actor, {
      subjectType: 'case',
      subjectId: record.id,
      title: 'Later step',
      priority: 'medium',
      dueAt: new Date(Date.now() + 5 * DAY).toISOString(),
    })
    await createTask(actor, {
      subjectType: 'case',
      subjectId: record.id,
      title: 'Sooner step',
      priority: 'medium',
      dueAt: new Date(Date.now() + DAY).toISOString(),
    })

    const [item] = await listCases({}, actor.userId)

    expect(item?.nextTask?.title).toBe('Sooner step')
    expect(item?.openTaskCount).toBe(2)
  })

  test('reports no next action once every task is done', async () => {
    const record = await openCase()
    const task = await createTask(actor, {
      subjectType: 'case',
      subjectId: record.id,
      title: 'Only step',
      priority: 'medium',
      dueAt: new Date(Date.now() + DAY).toISOString(),
    })
    await updateTask(actor, task.id, { status: 'completed' })

    const [item] = await listCases({}, actor.userId)

    expect(item?.nextTask).toBeNull()
    expect(item?.openTaskCount).toBe(0)
  })

  test('ignores tasks that belong to another record', async () => {
    const record = await openCase()
    await createTask(actor, {
      subjectType: 'organisation',
      subjectId: organisationId,
      title: 'Organisation-level task',
      priority: 'medium',
      dueAt: new Date(Date.now() + DAY).toISOString(),
    })

    const [item] = await listCases({}, actor.userId)
    const allTasks = await db.select().from(tasks)

    expect(allTasks).toHaveLength(1)
    expect(item?.nextTask).toBeNull()
  })
})
