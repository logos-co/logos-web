import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import {
  intakeSubmissionSchema,
  type IntakeSubmissionInput,
} from '@/contracts/intake'
import { db } from '@/server/db'
import {
  cases,
  contactMethods,
  externalIdentities,
  intakeSubmissions,
  organisations,
  people,
  tasks,
} from '@/server/db/schema'
import { processSubmission, recordSubmission } from '@/server/intake-repository'

import { isIntegrationEnabled, resetDatabase } from './support/database'

function submission(
  overrides: Partial<IntakeSubmissionInput> & { submissionId: string }
): IntakeSubmissionInput {
  return intakeSubmissionSchema.parse({
    formName: 'afformCoalitionPartner',
    name: 'Amina Okafor',
    email: 'amina@opensystems.example',
    city: 'Lisbon',
    country: 'Portugal',
    affiliatedOrgs: 'Open Systems Lab',
    hearAbout: 'Podcast',
    wantsNewsletter: true,
    wantsEvents: false,
    ...overrides,
  })
}

async function capture(input: IntakeSubmissionInput) {
  const stored = await recordSubmission(input, { ...input })
  return processSubmission(stored, input, `test-${input.submissionId}`)
}

describe.skipIf(!isIntegrationEnabled)('funnel intake', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  test('captures a submission as an unassigned, untriaged case', async () => {
    const result = await capture(submission({ submissionId: 'submission-001' }))

    expect(result.duplicate).toBe(false)
    expect(result.caseId).not.toBeNull()

    const [record] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, result.caseId as string))

    expect(record?.status).toBe('new')
    expect(record?.ownerUserId).toBeNull()
    expect(record?.nextAction).toBeNull()
    expect(record?.leadSource).toBe('Podcast')
    expect(record?.profile).toBe('Coalition Partner')
    expect(record?.title).toContain('Amina Okafor')
  })

  test('opens a triage task so the case is not silently idle', async () => {
    const result = await capture(submission({ submissionId: 'submission-002' }))

    const openTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.caseId, result.caseId as string))

    expect(openTasks).toHaveLength(1)
    expect(openTasks[0]?.title).toBe('Review intake')
    expect(openTasks[0]?.assigneeUserId).toBeNull()
    expect(openTasks[0]?.status).toBe('open')
  })

  test('records consent exactly as submitted', async () => {
    const result = await capture(
      submission({
        submissionId: 'submission-003',
        wantsNewsletter: true,
        wantsEvents: false,
      })
    )

    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, result.personId as string))

    expect(person?.consentNewsletter).toBe(true)
    expect(person?.consentEvents).toBe(false)
    expect(person?.consentRecordedAt).not.toBeNull()
  })

  test('defaults consent to false when the form omits it', async () => {
    const result = await capture(
      intakeSubmissionSchema.parse({
        submissionId: 'submission-004',
        formName: 'afformActivistBuilder',
        name: 'Rae Morgan',
        email: 'rae@example.org',
      })
    )

    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, result.personId as string))

    expect(person?.consentNewsletter).toBe(false)
    expect(person?.consentEvents).toBe(false)
    expect(person?.consentRecordedAt).toBeNull()
  })

  test('replaying the same submission id does not create a second case', async () => {
    const input = submission({ submissionId: 'submission-005' })
    const first = await capture(input)
    const second = await capture(input)

    expect(second.duplicate).toBe(true)
    expect(second.caseId).toBe(first.caseId)

    const allCases = await db.select().from(cases)
    const allSubmissions = await db.select().from(intakeSubmissions)

    expect(allCases).toHaveLength(1)
    expect(allSubmissions).toHaveLength(1)
  })

  test('a returning applicant reuses the person but gets a new case', async () => {
    const first = await capture(submission({ submissionId: 'submission-006' }))
    const second = await capture(
      submission({
        submissionId: 'submission-007',
        formName: 'afformActivistLeaderSteward',
        wantsEvents: true,
      })
    )

    expect(second.personId).toBe(first.personId)
    expect(second.caseId).not.toBe(first.caseId)

    const allPeople = await db.select().from(people)
    const allCases = await db.select().from(cases)
    const emails = await db
      .select()
      .from(contactMethods)
      .where(eq(contactMethods.type, 'email'))

    expect(allPeople).toHaveLength(1)
    expect(allCases).toHaveLength(2)
    expect(emails).toHaveLength(1)
  })

  test('a later submission can add consent but never removes it', async () => {
    await capture(
      submission({
        submissionId: 'submission-008',
        wantsNewsletter: true,
        wantsEvents: false,
      })
    )
    const second = await capture(
      submission({
        submissionId: 'submission-009',
        wantsNewsletter: false,
        wantsEvents: true,
      })
    )

    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, second.personId as string))

    expect(person?.consentNewsletter).toBe(true)
    expect(person?.consentEvents).toBe(true)
  })

  test('reuses an existing organisation instead of duplicating it', async () => {
    await capture(submission({ submissionId: 'submission-010' }))
    await capture(
      submission({
        submissionId: 'submission-011',
        email: 'leo@nodecraft.example',
        name: 'Leo Martin',
        affiliatedOrgs: 'open systems lab',
      })
    )

    const allOrganisations = await db.select().from(organisations)
    expect(allOrganisations).toHaveLength(1)
  })

  test('keeps the funnel submission id as an external identity', async () => {
    const result = await capture(submission({ submissionId: 'submission-012' }))

    const identities = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.entityId, result.caseId as string))

    expect(identities).toHaveLength(1)
    expect(identities[0]?.sourceSystem).toBe('funnel')
    expect(identities[0]?.sourceId).toBe('submission-012')
  })

  test('stores the raw payload before mapping runs', async () => {
    const input = submission({ submissionId: 'submission-013' })
    await recordSubmission(input, { ...input, extraField: 'kept' })

    const [stored] = await db
      .select()
      .from(intakeSubmissions)
      .where(eq(intakeSubmissions.submissionId, 'submission-013'))

    expect(stored?.processedAt).toBeNull()
    expect(stored?.caseId).toBeNull()
    expect(stored?.payload).toMatchObject({ extraField: 'kept' })
  })
})
