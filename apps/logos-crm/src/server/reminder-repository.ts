import { and, eq, isNotNull, lt, sql } from 'drizzle-orm'

import { db } from '@/server/db'
import { notificationDeliveries, tasks } from '@/server/db/schema'

export const TASK_REMINDER_KIND = 'task.overdue'

/**
 * One reminder per task per day.
 *
 * The date is part of the key so a task that stays overdue is chased again
 * tomorrow but not twice today - a reminder that arrives every time the cron
 * fires trains people to filter the sender.
 */
function reminderDedupeKey(taskId: string, day: string): string {
  return `${TASK_REMINDER_KIND}:${taskId}:${day}:email`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Queues an email for every overdue task that has somebody to chase.
 *
 * An unassigned overdue task is a real problem, but nobody is the right
 * recipient for it: it belongs in the unassigned queue, not in a stranger's
 * inbox. Completed and cancelled tasks are excluded by asking for open ones
 * rather than by filtering afterwards.
 */
export async function queueOverdueTaskReminders(): Promise<number> {
  const day = today()

  return db.transaction(async (transaction) => {
    const overdue = await transaction
      .select({
        id: tasks.id,
        caseId: tasks.caseId,
        assigneeUserId: tasks.assigneeUserId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.status, 'open'),
          lt(tasks.dueAt, new Date()),
          isNotNull(tasks.assigneeUserId)
        )
      )

    if (overdue.length === 0) return 0

    const inserted = await transaction
      .insert(notificationDeliveries)
      .values(
        overdue.map((task) => ({
          userId: task.assigneeUserId as string,
          channel: 'email' as const,
          kind: TASK_REMINDER_KIND,
          caseId: task.caseId,
          dedupeKey: reminderDedupeKey(task.id, day),
        }))
      )
      .onConflictDoNothing({ target: notificationDeliveries.dedupeKey })
      .returning({ id: notificationDeliveries.id })

    for (const delivery of inserted) {
      await transaction.execute(sql`
        select graphile_worker.add_job(
          'send_email_notification',
          payload => ${JSON.stringify({ deliveryId: delivery.id })}::json,
          max_attempts => 5,
          job_key => ${`notification:${delivery.id}`}
        )
      `)
    }

    return inserted.length
  })
}

/** Overdue tasks with no assignee, surfaced so they are not silently skipped. */
export async function countUnassignedOverdueTasks(): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'open'),
        lt(tasks.dueAt, new Date()),
        sql`${tasks.assigneeUserId} is null`
      )
    )

  return row?.value ?? 0
}
