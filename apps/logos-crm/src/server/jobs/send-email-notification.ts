import { eq } from 'drizzle-orm'
import type { Task } from 'graphile-worker'
import { z } from 'zod/v4'

import { buildExcerpt } from '@/contracts/mention'
import { db } from '@/server/db'
import {
  activities,
  cases,
  notificationDeliveries,
  users,
} from '@/server/db/schema'
import { getServerEnv } from '@/server/env'
import { sendMail } from '@/server/mailer'

const payloadSchema = z.object({ deliveryId: z.string().uuid() })

function caseLink(caseId: string | null): string | null {
  const { CRM_PUBLIC_URL } = getServerEnv()
  if (!caseId || !CRM_PUBLIC_URL) return null
  return `${CRM_PUBLIC_URL.replace(/\/$/, '')}/cases/${caseId}`
}

/**
 * Sends one mention notification.
 *
 * Re-reads the recipient's current state rather than trusting what was true
 * when the job was queued: a user suspended between queueing and delivery must
 * not be emailed, and the queue has no way to know that on its own.
 */
export const sendEmailNotification: Task = async (rawPayload) => {
  const { deliveryId } = payloadSchema.parse(rawPayload)

  const [delivery] = await db
    .select()
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.id, deliveryId))
    .limit(1)

  if (!delivery) return
  if (delivery.status === 'sent') return

  const [recipient] = await db
    .select()
    .from(users)
    .where(eq(users.id, delivery.userId))
    .limit(1)

  if (!recipient || recipient.status !== 'active') {
    await db
      .update(notificationDeliveries)
      .set({
        status: 'skipped',
        error: 'recipient_inactive',
        completedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, deliveryId))
    return
  }

  const [activity] = delivery.activityId
    ? await db
        .select()
        .from(activities)
        .where(eq(activities.id, delivery.activityId))
        .limit(1)
    : []

  const [linkedCase] = delivery.caseId
    ? await db
        .select()
        .from(cases)
        .where(eq(cases.id, delivery.caseId))
        .limit(1)
    : []

  const [author] = activity
    ? await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.id, activity.createdByUserId))
        .limit(1)
    : []

  const subject = linkedCase
    ? `${author?.displayName ?? 'Someone'} mentioned you on ${linkedCase.title}`
    : `${author?.displayName ?? 'Someone'} mentioned you`

  const link = caseLink(delivery.caseId)
  const lines = [
    `${author?.displayName ?? 'Someone'} mentioned you in a note.`,
    '',
    // A truncated excerpt rather than the note itself: email is outside the
    // access control this record sits behind, and the link is what carries the
    // reader back into it.
    activity ? buildExcerpt(activity.body) : '',
    '',
    link ? `Open the case: ${link}` : 'Open the CRM to read the full note.',
  ].filter((line) => line !== undefined)

  try {
    await db
      .update(notificationDeliveries)
      .set({ attempts: delivery.attempts + 1 })
      .where(eq(notificationDeliveries.id, deliveryId))

    await sendMail({
      to: recipient.email,
      subject,
      text: lines.join('\n'),
    })

    await db
      .update(notificationDeliveries)
      .set({ status: 'sent', error: null, completedAt: new Date() })
      .where(eq(notificationDeliveries.id, deliveryId))
  } catch (error) {
    // Record the outcome, then rethrow so the queue owns the retry schedule.
    // A second retry loop here would fight the one Graphile Worker already has.
    await db
      .update(notificationDeliveries)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.name : 'send_failed',
      })
      .where(eq(notificationDeliveries.id, deliveryId))
    throw error
  }
}
