import { and, eq, isNull, sql } from 'drizzle-orm'

import type { IntakeResult, IntakeSubmissionInput } from '@/contracts/intake'
import { intakeProfileByForm } from '@/contracts/intake'
import { recordAuditEvent, systemActor } from '@/server/audit'
import { defaultStageFor } from '@/contracts/pipeline'
import { findOrCreateOrganisation } from '@/server/directory-repository'
import { db } from '@/server/db'
import {
  caseAssignments,
  caseOrganisations,
  casePeople,
  caseWorkflowHistory,
  cases,
  contactMethods,
  externalIdentities,
  intakeSubmissions,
  organisations,
  people,
  tasks,
} from '@/server/db/schema'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** How long a freshly captured applicant may sit before triage is overdue. */
const TRIAGE_DUE_HOURS = 48

const SOURCE_SYSTEM = 'funnel'

function normalise(value: string): string {
  return value.trim().toLocaleLowerCase('en')
}

function triageDueAt(receivedAt: Date): Date {
  return new Date(receivedAt.getTime() + TRIAGE_DUE_HOURS * 60 * 60 * 1000)
}

async function findOrCreatePerson(
  transaction: Transaction,
  input: Readonly<IntakeSubmissionInput>,
  receivedAt: Date
): Promise<string> {
  const email = input.email ? normalise(input.email) : null

  // Email is a matching hint, not an identity key, but within a single funnel
  // it is the only deterministic signal available: the same address applying
  // twice is the same person, and creating a second record would split their
  // history across two cases nobody can see together.
  if (email) {
    const [existing] = await transaction
      .select({ personId: contactMethods.personId })
      .from(contactMethods)
      .where(
        and(
          eq(contactMethods.type, 'email'),
          eq(contactMethods.normalisedValue, email)
        )
      )
      .limit(1)

    if (existing?.personId) {
      await transaction
        .update(people)
        .set({
          // Consent only ever moves forward from a submission: this form said
          // yes, so record it. Withdrawal is a separate, explicit action.
          ...(input.wantsNewsletter ? { consentNewsletter: true } : {}),
          ...(input.wantsEvents ? { consentEvents: true } : {}),
          ...(input.wantsNewsletter || input.wantsEvents
            ? { consentRecordedAt: receivedAt }
            : {}),
          updatedAt: receivedAt,
        })
        .where(eq(people.id, existing.personId))

      return existing.personId
    }
  }

  const [created] = await transaction
    .insert(people)
    .values({
      fullName: input.name,
      status: 'prospect',
      summary: input.skills || null,
      consentNewsletter: input.wantsNewsletter,
      consentEvents: input.wantsEvents,
      consentRecordedAt:
        input.wantsNewsletter || input.wantsEvents ? receivedAt : null,
    })
    .returning()

  if (!created) throw new Error('The person record was not created.')

  const methods: (typeof contactMethods.$inferInsert)[] = []
  if (input.email && email) {
    methods.push({
      personId: created.id,
      type: 'email',
      displayValue: input.email,
      normalisedValue: email,
      isPreferred: true,
    })
  }
  for (const handle of input.chat) {
    methods.push({
      personId: created.id,
      type: 'messaging',
      displayValue: handle,
      normalisedValue: normalise(handle),
      label: input.chatService || null,
    })
  }
  for (const url of input.website) {
    methods.push({
      personId: created.id,
      type: 'url',
      displayValue: url,
      normalisedValue: normalise(url),
    })
  }
  if (methods.length > 0) {
    await transaction.insert(contactMethods).values(methods)
  }

  return created.id
}

function buildSummary(input: Readonly<IntakeSubmissionInput>): string | null {
  const parts = [
    input.techVision ? `Tech vision: ${input.techVision}` : null,
    input.activitiesVision ? `Activities: ${input.activitiesVision}` : null,
    input.background ? `Background: ${input.background}` : null,
    input.questions ? `Questions: ${input.questions}` : null,
    input.city || input.country
      ? `Location: ${[input.city, input.country].filter(Boolean).join(', ')}`
      : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join('\n\n') : null
}

/**
 * Stores the raw submission and returns it. Committed on its own, before any
 * mapping, so a mapping failure never costs an applicant. A repeat of the same
 * `submissionId` returns the stored row instead of inserting a second one.
 */
export async function recordSubmission(
  input: Readonly<IntakeSubmissionInput>,
  payload: unknown
): Promise<typeof intakeSubmissions.$inferSelect> {
  await db
    .insert(intakeSubmissions)
    .values({
      submissionId: input.submissionId,
      formName: input.formName,
      payload: payload as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: intakeSubmissions.submissionId })

  const [row] = await db
    .select()
    .from(intakeSubmissions)
    .where(eq(intakeSubmissions.submissionId, input.submissionId))
    .limit(1)

  if (!row) throw new Error('The submission was not stored.')
  return row
}

export interface ProcessSubmissionOptions {
  /** Which system the record came from, e.g. `funnel` or `notion`. */
  sourceSystem?: string
  /**
   * Whether the history this writes was observed or imported. Imported history
   * is excluded from duration metrics, because its timestamps record when the
   * export ran rather than when anything was decided.
   */
  changeSource?: 'system' | 'import'
}

/**
 * Maps a stored submission into a person, an optional organisation, and an
 * unassigned case with a triage task. Everything commits together, and a
 * submission that has already been processed is returned unchanged.
 *
 * The same rules serve the public funnel and the Notion bridge import, so an
 * imported applicant and a freshly submitted one become the same kind of record
 * - only the recorded source differs.
 */
export async function processSubmission(
  submission: Readonly<typeof intakeSubmissions.$inferSelect>,
  input: Readonly<IntakeSubmissionInput>,
  requestId: string,
  options: Readonly<ProcessSubmissionOptions> = {}
): Promise<IntakeResult> {
  const sourceSystem = options.sourceSystem ?? SOURCE_SYSTEM
  const changeSource = options.changeSource ?? 'system'

  if (submission.processedAt) {
    return {
      submissionId: submission.submissionId,
      caseId: submission.caseId,
      personId: submission.personId,
      duplicate: true,
    }
  }

  const actor = systemActor(requestId)
  const receivedAt = submission.receivedAt

  return db.transaction(async (transaction) => {
    // Re-check inside the transaction: two concurrent retries of the same
    // submission must not both map it.
    const [claimed] = await transaction
      .update(intakeSubmissions)
      .set({ processedAt: new Date() })
      .where(
        and(
          eq(intakeSubmissions.id, submission.id),
          isNull(intakeSubmissions.processedAt)
        )
      )
      .returning()

    if (!claimed) {
      const [current] = await transaction
        .select()
        .from(intakeSubmissions)
        .where(eq(intakeSubmissions.id, submission.id))
        .limit(1)

      return {
        submissionId: submission.submissionId,
        caseId: current?.caseId ?? null,
        personId: current?.personId ?? null,
        duplicate: true,
      }
    }

    const personId = await findOrCreatePerson(transaction, input, receivedAt)
    const organisationId = input.affiliatedOrgs
      ? await findOrCreateOrganisation(transaction, input.affiliatedOrgs)
      : null

    const [row] = await transaction
      .insert(cases)
      .values({
        title: `${intakeProfileByForm[input.formName]} - ${input.name}`,
        // Every one of the 63 funnel-created rows in the Notion export is
        // BU=Movement and carries only a `Mvmt Status`; none has an Ecodev
        // `Status`. The public funnel feeds the Movement board, so a
        // submission enters at that pipeline's first stage.
        pipeline: 'movement',
        stage: defaultStageFor('movement'),
        priority: 'medium',
        status: 'new',
        leadSource: input.hearAbout ?? null,
        profile: intakeProfileByForm[input.formName],
        summary: buildSummary(input),
        createdAt: receivedAt,
        updatedAt: receivedAt,
      })
      .returning()

    if (!row) throw new Error('The case was not created.')

    await transaction.insert(caseAssignments).values({
      caseId: row.id,
      validFrom: receivedAt,
      source: changeSource,
    })

    await transaction.insert(caseWorkflowHistory).values({
      caseId: row.id,
      fromStatus: null,
      toStatus: row.status,
      toStage: row.stage,
      effectiveAt: receivedAt,
      source: changeSource,
    })

    await transaction
      .insert(casePeople)
      .values({ caseId: row.id, personId, isPrimary: true })

    if (organisationId) {
      await transaction
        .insert(caseOrganisations)
        .values({ caseId: row.id, organisationId, isPrimary: true })
    }

    // The case has no next action yet, so triage itself is the open task. This
    // is what keeps an unassigned intake out of the "nothing to do" bucket.
    await transaction.insert(tasks).values({
      caseId: row.id,
      title: 'Review intake',
      description: `${intakeProfileByForm[input.formName]} submission received through the public funnel.`,
      priority: 'medium',
      dueAt: triageDueAt(receivedAt),
    })

    await transaction.insert(externalIdentities).values([
      {
        sourceSystem,
        entityType: 'case',
        entityId: row.id,
        sourceId: submission.submissionId,
        sourceUpdatedAt: receivedAt,
      },
    ])

    await transaction
      .update(intakeSubmissions)
      .set({ caseId: row.id, personId, error: null })
      .where(eq(intakeSubmissions.id, submission.id))

    await recordAuditEvent(transaction, actor, {
      action: 'case.captured_from_intake',
      entityType: 'case',
      entityId: row.id,
      summary: intakeProfileByForm[input.formName],
    })

    return {
      submissionId: submission.submissionId,
      caseId: row.id,
      personId,
      duplicate: false,
    }
  })
}

/**
 * Releases a submission that failed to map, so a fixed mapping can replay it.
 * The stored payload is what makes that possible.
 */
export async function recordSubmissionFailure(
  submissionId: string,
  message: string
): Promise<void> {
  await db
    .update(intakeSubmissions)
    .set({ processedAt: null, error: message.slice(0, 1_000) })
    .where(eq(intakeSubmissions.submissionId, submissionId))
}

export async function countUnprocessedSubmissions(): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(intakeSubmissions)
    .where(isNull(intakeSubmissions.processedAt))

  return row?.value ?? 0
}
