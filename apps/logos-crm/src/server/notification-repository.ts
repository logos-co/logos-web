import { eq, inArray, or, sql } from 'drizzle-orm'

import { parseMentionHandles } from '@/contracts/mention'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import {
  activityMentions,
  notificationDeliveries,
  users,
} from '@/server/db/schema'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export const MENTION_NOTIFICATION_KIND = 'activity.mention'

export interface MentionNotificationInput {
  activityId: string
  caseId: string | null
  body: string
}

function dedupeKey(
  activityId: string,
  userId: string,
  channel: string
): string {
  return `${MENTION_NOTIFICATION_KIND}:${activityId}:${userId}:${channel}`
}

/**
 * Resolves the mentions in a note and queues one notification per mentioned
 * user, inside the caller's transaction.
 *
 * Everything commits together: the mention rows, the delivery records, and the
 * queued jobs. A job that can commit without its activity would deliver a
 * notification about something that never happened, and an activity that
 * commits without its job silently notifies nobody.
 *
 * Returns the users who will be notified, so callers can surface it.
 */
export async function queueMentionNotifications(
  transaction: Transaction,
  actor: Readonly<ActorContext>,
  input: Readonly<MentionNotificationInput>
): Promise<string[]> {
  const handles = parseMentionHandles(input.body)
  if (handles.length === 0) return []

  // Handles are matched against real users; an unknown one is simply text. The
  // alternative - failing the note - would make a typo cost the coordinator
  // their work.
  const candidates = await transaction
    .select({ id: users.id, email: users.normalisedEmail })
    .from(users)
    .where(
      or(
        inArray(users.normalisedEmail, handles),
        // `@first.last` is matched against the local part of the address, which
        // is how these handles are written in practice.
        inArray(sql`split_part(${users.normalisedEmail}, '@', 1)`, handles)
      )
    )

  const mentioned = candidates
    .filter((candidate) => candidate.id !== actor.userId)
    .map((candidate) => candidate.id)

  if (mentioned.length === 0) return []

  await transaction
    .insert(activityMentions)
    .values(
      mentioned.map((userId) => ({
        activityId: input.activityId,
        mentionedUserId: userId,
      }))
    )
    .onConflictDoNothing()

  const deliveries = mentioned.map((userId) => ({
    userId,
    channel: 'email' as const,
    kind: MENTION_NOTIFICATION_KIND,
    activityId: input.activityId,
    caseId: input.caseId,
    dedupeKey: dedupeKey(input.activityId, userId, 'email'),
  }))

  const inserted = await transaction
    .insert(notificationDeliveries)
    .values(deliveries)
    .onConflictDoNothing({ target: notificationDeliveries.dedupeKey })
    .returning({ id: notificationDeliveries.id })

  // Enqueued through the queue's own SQL function so the job shares this
  // transaction. Using the library's client would open a second connection and
  // the job could outlive a rolled-back note.
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

  return mentioned
}

export async function listMentionedUserIds(
  activityId: string
): Promise<string[]> {
  const rows = await db
    .select({ userId: activityMentions.mentionedUserId })
    .from(activityMentions)
    .where(eq(activityMentions.activityId, activityId))

  return rows.map((row) => row.userId)
}
