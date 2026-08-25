import { eq, sql } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import { createCase } from '@/server/case-repository'
import { db } from '@/server/db'
import { activityMentions, notificationDeliveries } from '@/server/db/schema'
import { createActivity } from '@/server/work-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

/**
 * `graphile_worker.jobs` is a read-only view; the rows live in the private
 * table behind it, which is what these fixtures have to clear and count.
 */
async function queuedJobCount(): Promise<number> {
  const result = await db.execute<{ count: number }>(
    sql`select count(*)::int as count
        from graphile_worker.jobs
        where task_identifier = 'send_email_notification'`
  )
  return Number(result.rows[0]?.count ?? 0)
}

async function clearQueue(): Promise<void> {
  await db.execute(sql`delete from graphile_worker._private_jobs`)
}

describe.skipIf(!isIntegrationEnabled)('mention notifications', () => {
  let author: ActorContext
  let colleague: ActorContext
  let organisationId: string
  let caseId: string

  beforeEach(async () => {
    await resetDatabase()
    await clearQueue()
    author = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    colleague = await createTestUser('Jon Bell', 'jon.bell@logos.co')
    organisationId = await createTestOrganisation('Open Systems Lab')

    const record = await createCase(author, {
      title: 'Protocol research partnership',
      pipeline: 'ecodev' as const,
      stage: 'lead',
      priority: 'medium',
      organisationId,
      personIds: [],
    })
    caseId = record.id
  })

  async function addNote(body: string) {
    return createActivity(author, {
      subjectType: 'case',
      subjectId: caseId,
      type: 'note',
      body,
    })
  }

  test('resolves a handle to a user and records the mention', async () => {
    const activity = await addNote('Can @jon.bell pick this up?')

    const mentions = await db
      .select()
      .from(activityMentions)
      .where(eq(activityMentions.activityId, activity.id))

    expect(mentions).toHaveLength(1)
    expect(mentions[0]?.mentionedUserId).toBe(colleague.userId)
  })

  test('queues a delivery and a job in the same transaction as the note', async () => {
    const activity = await addNote('Over to @jon.bell')

    const deliveries = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.activityId, activity.id))

    expect(deliveries).toHaveLength(1)
    expect(deliveries[0]?.status).toBe('pending')
    expect(deliveries[0]?.channel).toBe('email')
    expect(await queuedJobCount()).toBe(1)
  })

  test('matches a full email address as well as a bare handle', async () => {
    const activity = await addNote('cc @jon.bell@logos.co')

    const mentions = await db
      .select()
      .from(activityMentions)
      .where(eq(activityMentions.activityId, activity.id))

    expect(mentions).toHaveLength(1)
    expect(mentions[0]?.mentionedUserId).toBe(colleague.userId)
  })

  test('does not notify the author for mentioning themselves', async () => {
    const activity = await addNote('Note to self, @mara.chen: chase this.')

    const mentions = await db
      .select()
      .from(activityMentions)
      .where(eq(activityMentions.activityId, activity.id))

    expect(mentions).toHaveLength(0)
    expect(await queuedJobCount()).toBe(0)
  })

  test('ignores an unknown handle instead of failing the note', async () => {
    const activity = await addNote('Asked @nobody.here to look')

    expect(activity.id).toBeTruthy()
    expect(await queuedJobCount()).toBe(0)
  })

  test('notifies each mentioned person once, however often they are named', async () => {
    const activity = await addNote('@jon.bell and again @jon.bell')

    const deliveries = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.activityId, activity.id))

    expect(deliveries).toHaveLength(1)
    expect(await queuedJobCount()).toBe(1)
  })

  test('notifies everyone named in one note', async () => {
    const third = await createTestUser('Niko Reyes', 'niko.reyes@logos.co')
    const activity = await addNote('@jon.bell @niko.reyes please review')

    const mentions = await db
      .select()
      .from(activityMentions)
      .where(eq(activityMentions.activityId, activity.id))

    expect(mentions.map((row) => row.mentionedUserId).sort()).toEqual(
      [colleague.userId, third.userId].sort()
    )
    expect(await queuedJobCount()).toBe(2)
  })

  test('queues nothing for a note that mentions nobody', async () => {
    await addNote('Reviewed their proposal, looks solid.')

    const deliveries = await db.select().from(notificationDeliveries)

    expect(deliveries).toHaveLength(0)
    expect(await queuedJobCount()).toBe(0)
  })
})
