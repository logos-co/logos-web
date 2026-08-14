import type { Task } from 'graphile-worker'

import {
  countUnassignedOverdueTasks,
  queueOverdueTaskReminders,
} from '@/server/reminder-repository'

/**
 * Chases overdue work once a day.
 *
 * Unassigned overdue tasks are counted rather than emailed: they are a real
 * problem, but nobody is the right recipient, and recording the number keeps
 * them from disappearing quietly between a queue nobody opened and an inbox
 * nobody owns.
 */
export const sendTaskRemindersTask: Task = async (_payload, helpers) => {
  const queued = await queueOverdueTaskReminders()
  const unassigned = await countUnassignedOverdueTasks()

  if (queued > 0) helpers.logger.info(`Queued ${queued} overdue reminders.`)
  if (unassigned > 0) {
    helpers.logger.warn(
      `${unassigned} overdue tasks have no assignee to remind.`
    )
  }
}
