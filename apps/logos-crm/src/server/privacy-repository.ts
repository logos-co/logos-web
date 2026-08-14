import { and, asc, eq, isNotNull, lt, sql } from 'drizzle-orm'

import type {
  CreatePrivacyRequestInput,
  PrivacyState,
  SetDoNotContactInput,
  UpdatePrivacyRequestInput,
} from '@/contracts/privacy'
import { INTAKE_PAYLOAD_RETENTION_DAYS } from '@/contracts/values'
import { recordAuditEvent, systemActor } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import {
  contactMethods,
  intakeSubmissions,
  people,
  privacyRequests,
} from '@/server/db/schema'
import { notFound } from '@/server/service-errors'

export async function getPrivacyState(personId: string): Promise<PrivacyState> {
  const [person] = await db
    .select()
    .from(people)
    .where(eq(people.id, personId))
    .limit(1)

  if (!person) throw notFound('The person no longer exists.')

  const requests = await db
    .select()
    .from(privacyRequests)
    .where(eq(privacyRequests.personId, personId))
    .orderBy(asc(privacyRequests.receivedAt))

  return {
    doNotContact: person.doNotContact,
    doNotContactAt: person.doNotContactAt?.toISOString() ?? null,
    doNotContactReason: person.doNotContactReason,
    anonymisedAt: person.anonymisedAt?.toISOString() ?? null,
    requests: requests.map((request) => ({
      id: request.id,
      personId: request.personId,
      type: request.type,
      status: request.status,
      receivedAt: request.receivedAt.toISOString(),
      completedAt: request.completedAt?.toISOString() ?? null,
      notes: request.notes,
    })),
  }
}

/**
 * Records that somebody asked not to be contacted, and suppresses their contact
 * methods so the instruction is visible wherever an address is.
 *
 * Suppression is a flag, not a deletion: the address stays so a later
 * submission from it can be recognised as the same person rather than creating
 * a fresh record that nobody has been told to leave alone.
 */
export async function setDoNotContact(
  actor: Readonly<ActorContext>,
  personId: string,
  input: Readonly<SetDoNotContactInput>
): Promise<PrivacyState> {
  await db.transaction(async (transaction) => {
    const [person] = await transaction
      .select()
      .from(people)
      .where(eq(people.id, personId))
      .limit(1)

    if (!person) throw notFound('The person no longer exists.')

    const now = new Date()

    await transaction
      .update(people)
      .set({
        doNotContact: input.doNotContact,
        doNotContactAt: input.doNotContact ? now : null,
        doNotContactReason: input.doNotContact ? (input.reason ?? null) : null,
        updatedAt: now,
      })
      .where(eq(people.id, personId))

    await transaction
      .update(contactMethods)
      .set({ isSuppressed: input.doNotContact })
      .where(eq(contactMethods.personId, personId))

    await recordAuditEvent(transaction, actor, {
      action: input.doNotContact
        ? 'person.do_not_contact_set'
        : 'person.do_not_contact_cleared',
      entityType: 'person',
      entityId: personId,
      summary: input.reason ?? undefined,
      changes: {
        doNotContact: { from: person.doNotContact, to: input.doNotContact },
      },
    })
  })

  return getPrivacyState(personId)
}

export async function createPrivacyRequest(
  actor: Readonly<ActorContext>,
  personId: string,
  input: Readonly<CreatePrivacyRequestInput>
): Promise<PrivacyState> {
  await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(privacyRequests)
      .values({
        personId,
        type: input.type,
        notes: input.notes ?? null,
        handledByUserId: actor.userId,
      })
      .returning()

    if (!created) throw new Error('The privacy request was not recorded.')

    await recordAuditEvent(transaction, actor, {
      action: 'privacy_request.received',
      entityType: 'person',
      entityId: personId,
      summary: input.type,
    })
  })

  return getPrivacyState(personId)
}

export async function updatePrivacyRequest(
  actor: Readonly<ActorContext>,
  requestId: string,
  input: Readonly<UpdatePrivacyRequestInput>
): Promise<PrivacyState> {
  const personId = await db.transaction(async (transaction) => {
    const [request] = await transaction
      .select()
      .from(privacyRequests)
      .where(eq(privacyRequests.id, requestId))
      .limit(1)

    if (!request) throw notFound('The request no longer exists.')

    const settled = input.status === 'completed' || input.status === 'refused'

    await transaction
      .update(privacyRequests)
      .set({
        status: input.status,
        completedAt: settled ? new Date() : null,
        handledByUserId: actor.userId,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      })
      .where(eq(privacyRequests.id, requestId))

    await recordAuditEvent(transaction, actor, {
      action: 'privacy_request.updated',
      entityType: 'person',
      entityId: request.personId,
      changes: { status: { from: request.status, to: input.status } },
    })

    return request.personId
  })

  return getPrivacyState(personId)
}

/**
 * Applies an erasure request.
 *
 * The personal data goes; the record does not. Cases, links, and the audit
 * trail remain so the history of what was decided stays intact and provable —
 * deleting the row would take the evidence of handling the request with it.
 * The name becomes a marker rather than an empty string, so a screen showing
 * this person reads as erased instead of broken.
 */
export async function anonymisePerson(
  actor: Readonly<ActorContext>,
  personId: string
): Promise<PrivacyState> {
  await db.transaction(async (transaction) => {
    const [person] = await transaction
      .select()
      .from(people)
      .where(eq(people.id, personId))
      .limit(1)

    if (!person) throw notFound('The person no longer exists.')

    const now = new Date()

    await transaction
      .update(people)
      .set({
        fullName: 'Erased person',
        preferredName: null,
        roleTitle: null,
        summary: null,
        doNotContact: true,
        doNotContactAt: now,
        anonymisedAt: now,
        updatedAt: now,
      })
      .where(eq(people.id, personId))

    await transaction
      .delete(contactMethods)
      .where(eq(contactMethods.personId, personId))

    // The stored funnel payload is another copy of the same details, so it goes
    // with them. Erasing the person while leaving their submission behind would
    // not be an erasure.
    await transaction
      .update(intakeSubmissions)
      .set({ payload: sql`'{}'::jsonb` })
      .where(eq(intakeSubmissions.personId, personId))

    await recordAuditEvent(transaction, actor, {
      action: 'person.anonymised',
      entityType: 'person',
      entityId: personId,
      changes: { anonymisedAt: { from: null, to: now.toISOString() } },
    })
  })

  return getPrivacyState(personId)
}

/**
 * Clears stored funnel payloads once their records exist and the replay window
 * has passed. Unprocessed submissions are left alone: their payload is still
 * the only copy of that applicant.
 */
export async function expireIntakePayloads(requestId: string): Promise<number> {
  const cutoff = new Date(
    Date.now() - INTAKE_PAYLOAD_RETENTION_DAYS * 24 * 60 * 60 * 1000
  )

  const cleared = await db.transaction(async (transaction) => {
    const rows = await transaction
      .update(intakeSubmissions)
      .set({ payload: sql`'{}'::jsonb` })
      .where(
        and(
          isNotNull(intakeSubmissions.processedAt),
          lt(intakeSubmissions.processedAt, cutoff),
          sql`${intakeSubmissions.payload} <> '{}'::jsonb`
        )
      )
      .returning({ id: intakeSubmissions.id })

    if (rows.length > 0) {
      await recordAuditEvent(transaction, systemActor(requestId), {
        action: 'intake_payload.expired',
        entityType: 'case',
        entityId: rows[0]?.id ?? '',
        summary: `${rows.length} payloads cleared`,
      })
    }

    return rows.length
  })

  return cleared
}
