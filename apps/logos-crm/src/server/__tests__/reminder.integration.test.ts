import { eq, sql } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import { createCase } from '@/server/case-repository'
import { db } from '@/server/db'
import { notificationDeliveries } from '@/server/db/schema'
import {
  countUnassignedOverdueTasks,
  queueOverdueTaskReminders,
  TASK_REMINDER_KIND,
} from '@/server/reminder-repository'
import { createTask, updateTask } from '@/server/work-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

const DAY = 24 * 60 * 60 * 1000

describe.skipIf(!isIntegrationEnabled)('overdue task reminders', () => {
  let actor: ActorContext
  let caseId: string

  beforeEach(async () => {
    await resetDatabase()
    await db.execute(sql`delete from graphile_worker._private_jobs`)
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    const organisationId = await createTestOrganisation('Open Systems Lab')
    const record = await createCase(actor, {
      title: 'Protocol research partnership',
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [],
    })
    caseId = record.id
  })

  async function addTask(dueAt: Date, assigneeUserId?: string) {
    return createTask(actor, {
      subjectType: 'case',
      subjectId: caseId,
      title: 'Follow up',
      priority: 'medium',
      dueAt: dueAt.toISOString(),
      ...(assigneeUserId ? { assigneeUserId } : {}),
    })
  }

  test('queues a reminder for an overdue task', async () => {
    await addTask(new Date(Date.now() - DAY), actor.userId)

    const queued = await queueOverdueTaskReminders()

    const deliveries = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.kind, TASK_REMINDER_KIND))

    expect(queued).toBe(1)
    expect(deliveries[0]?.userId).toBe(actor.userId)
    expect(deliveries[0]?.caseId).toBe(caseId)
  })

  test('ignores a task that is not due yet', async () => {
    await addTask(new Date(Date.now() + DAY), actor.userId)

    expect(await queueOverdueTaskReminders()).toBe(0)
  })

  test('stops chasing a task once it is completed', async () => {
    const task = await addTask(new Date(Date.now() - DAY), actor.userId)
    await updateTask(actor, task.id, { status: 'completed' })

    expect(await queueOverdueTaskReminders()).toBe(0)
  })

  test('reminds only once on the same day', async () => {
    await addTask(new Date(Date.now() - DAY), actor.userId)

    // A reminder on every cron firing trains people to filter the sender.
    expect(await queueOverdueTaskReminders()).toBe(1)
    expect(await queueOverdueTaskReminders()).toBe(0)
  })

  test('does not email anyone about an unassigned overdue task', async () => {
    await addTask(new Date(Date.now() - DAY))

    // It is a real problem, but nobody is the right recipient.
    expect(await queueOverdueTaskReminders()).toBe(0)
    expect(await countUnassignedOverdueTasks()).toBe(1)
  })

  test('queues one job per reminder for the worker to send', async () => {
    const other = await createTestUser('Jon Bell', 'jon.bell@logos.co')
    await addTask(new Date(Date.now() - DAY), actor.userId)
    await addTask(new Date(Date.now() - 2 * DAY), other.userId)

    await queueOverdueTaskReminders()

    const jobs = await db.execute<{ count: number }>(
      sql`select count(*)::int as count from graphile_worker.jobs where task_identifier = 'send_email_notification'`
    )

    expect(Number(jobs.rows[0]?.count ?? 0)).toBe(2)
  })

  test('reminds each assignee about their own task only', async () => {
    const other = await createTestUser('Jon Bell', 'jon.bell@logos.co')
    await addTask(new Date(Date.now() - DAY), actor.userId)
    await addTask(new Date(Date.now() - DAY), other.userId)

    await queueOverdueTaskReminders()

    const deliveries = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.kind, TASK_REMINDER_KIND))

    expect(deliveries.map((row) => row.userId).sort()).toEqual(
      [actor.userId, other.userId].sort()
    )
  })
})
