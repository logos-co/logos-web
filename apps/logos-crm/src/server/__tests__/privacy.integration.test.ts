import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import { INTAKE_PAYLOAD_RETENTION_DAYS } from '@/contracts/values'
import type { ActorContext } from '@/server/auth'
import { createCase } from '@/server/case-repository'
import { db } from '@/server/db'
import {
  auditEvents,
  casePeople,
  contactMethods,
  intakeSubmissions,
  organisations,
  people,
} from '@/server/db/schema'
import {
  anonymisePerson,
  createPrivacyRequest,
  expireIntakePayloads,
  getPrivacyState,
  setDoNotContact,
  updatePrivacyRequest,
} from '@/server/privacy-repository'

import {
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

const DAY = 24 * 60 * 60 * 1000

async function addPerson(fullName: string, email: string): Promise<string> {
  const [person] = await db.insert(people).values({ fullName }).returning()
  if (!person) throw new Error('The test person was not created.')

  await db.insert(contactMethods).values({
    personId: person.id,
    type: 'email',
    displayValue: email,
    normalisedValue: email.toLocaleLowerCase('en'),
    isPreferred: true,
  })

  return person.id
}

describe.skipIf(!isIntegrationEnabled)('suppression', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
  })

  test('records the request and suppresses the contact methods', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')

    const state = await setDoNotContact(actor, personId, {
      doNotContact: true,
      reason: 'Asked us to stop.',
    })

    const methods = await db
      .select()
      .from(contactMethods)
      .where(eq(contactMethods.personId, personId))

    expect(state.doNotContact).toBe(true)
    expect(state.doNotContactReason).toBe('Asked us to stop.')
    expect(methods.every((method) => method.isSuppressed)).toBe(true)
  })

  test('keeps the address so a later submission is still recognised', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')

    await setDoNotContact(actor, personId, { doNotContact: true })

    const methods = await db
      .select()
      .from(contactMethods)
      .where(eq(contactMethods.personId, personId))

    // Deleting it would let the same person return as a fresh record nobody
    // has been told to leave alone.
    expect(methods).toHaveLength(1)
    expect(methods[0]?.normalisedValue).toBe('amina@example.org')
  })

  test('can be lifted again and audits both directions', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')

    await setDoNotContact(actor, personId, { doNotContact: true })
    const state = await setDoNotContact(actor, personId, {
      doNotContact: false,
    })

    const actions = (
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.entityId, personId))
    ).map((event) => event.action)

    expect(state.doNotContact).toBe(false)
    expect(state.doNotContactAt).toBeNull()
    expect(actions).toContain('person.do_not_contact_set')
    expect(actions).toContain('person.do_not_contact_cleared')
  })
})

describe.skipIf(!isIntegrationEnabled)('privacy requests', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
  })

  test('records a request as work with a status', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')

    const state = await createPrivacyRequest(actor, personId, {
      type: 'access',
      notes: 'Asked for a copy of their record.',
    })

    expect(state.requests).toHaveLength(1)
    expect(state.requests[0]?.status).toBe('received')
    expect(state.requests[0]?.completedAt).toBeNull()
  })

  test('stamps a completion time when the request is settled', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')
    const created = await createPrivacyRequest(actor, personId, {
      type: 'erasure',
    })
    const requestId = created.requests[0]?.id as string

    const state = await updatePrivacyRequest(actor, requestId, {
      status: 'completed',
    })

    expect(state.requests[0]?.status).toBe('completed')
    expect(state.requests[0]?.completedAt).not.toBeNull()
  })

  test('leaves an in-progress request without a completion time', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')
    const created = await createPrivacyRequest(actor, personId, {
      type: 'access',
    })

    const state = await updatePrivacyRequest(
      actor,
      created.requests[0]?.id as string,
      { status: 'in_progress' }
    )

    expect(state.requests[0]?.completedAt).toBeNull()
  })
})

describe.skipIf(!isIntegrationEnabled)('erasure', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
  })

  test('removes the personal data and marks the record erased', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')

    const state = await anonymisePerson(actor, personId)

    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, personId))
    const methods = await db
      .select()
      .from(contactMethods)
      .where(eq(contactMethods.personId, personId))

    expect(person?.fullName).toBe('Erased person')
    expect(methods).toHaveLength(0)
    expect(state.anonymisedAt).not.toBeNull()
  })

  test('suppresses contact so the record cannot be written to again', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')

    const state = await anonymisePerson(actor, personId)

    expect(state.doNotContact).toBe(true)
  })

  test('keeps case links and the audit trail', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')
    const [organisation] = await db
      .insert(organisations)
      .values({
        displayName: 'Open Systems Lab',
        normalisedName: 'open systems lab',
      })
      .returning()
    const record = await createCase(actor, {
      title: 'Protocol research partnership',
      pipeline: 'ecodev' as const,
      stage: 'lead',
      priority: 'medium',
      organisationId: organisation?.id,
      personIds: [personId],
    })

    await anonymisePerson(actor, personId)

    const links = await db
      .select()
      .from(casePeople)
      .where(eq(casePeople.personId, personId))
    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, personId))

    // The evidence that the request was handled has to outlive the data it was
    // about, and the case still needs to say who it was about.
    expect(links).toHaveLength(1)
    expect(links[0]?.caseId).toBe(record.id)
    expect(events.some((event) => event.action === 'person.anonymised')).toBe(
      true
    )
  })

  test('clears the stored submission that holds the same details', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')
    await db.insert(intakeSubmissions).values({
      submissionId: 'notion:page-1',
      formName: 'afformCoalitionPartner',
      payload: { name: 'Amina Okafor', email: 'amina@example.org' },
      personId,
      processedAt: new Date(),
    })

    await anonymisePerson(actor, personId)

    const [submission] = await db
      .select()
      .from(intakeSubmissions)
      .where(eq(intakeSubmissions.personId, personId))

    expect(submission?.payload).toEqual({})
  })
})

describe.skipIf(!isIntegrationEnabled)('intake payload retention', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  async function addSubmission(
    submissionId: string,
    processedAt: Date | null
  ): Promise<void> {
    await db.insert(intakeSubmissions).values({
      submissionId,
      formName: 'afformCoalitionPartner',
      payload: { name: 'Amina Okafor' },
      processedAt,
    })
  }

  test('clears payloads once the replay window has passed', async () => {
    await addSubmission(
      'old',
      new Date(Date.now() - (INTAKE_PAYLOAD_RETENTION_DAYS + 1) * DAY)
    )

    const cleared = await expireIntakePayloads('test')

    const [row] = await db
      .select()
      .from(intakeSubmissions)
      .where(eq(intakeSubmissions.submissionId, 'old'))

    expect(cleared).toBe(1)
    expect(row?.payload).toEqual({})
  })

  test('leaves a recently processed submission alone', async () => {
    await addSubmission('recent', new Date())

    expect(await expireIntakePayloads('test')).toBe(0)
  })

  test('never clears an unprocessed submission', async () => {
    // Its payload is still the only copy of that applicant.
    await addSubmission('unprocessed', null)

    expect(await expireIntakePayloads('test')).toBe(0)
  })

  test('is idempotent across runs', async () => {
    await addSubmission(
      'old',
      new Date(Date.now() - (INTAKE_PAYLOAD_RETENTION_DAYS + 1) * DAY)
    )

    expect(await expireIntakePayloads('test')).toBe(1)
    expect(await expireIntakePayloads('test')).toBe(0)
  })
})

describe.skipIf(!isIntegrationEnabled)('privacy state', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  test('reports a clean record as contactable', async () => {
    const personId = await addPerson('Amina Okafor', 'amina@example.org')

    const state = await getPrivacyState(personId)

    expect(state.doNotContact).toBe(false)
    expect(state.anonymisedAt).toBeNull()
    expect(state.requests).toHaveLength(0)
  })
})
