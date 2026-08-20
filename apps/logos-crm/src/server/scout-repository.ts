import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  type SQL,
} from 'drizzle-orm'

import type {
  BulkScoutReviewInput,
  RecordScoutReviewInput,
  ScoutAssessment,
  ScoutCandidateDetail,
  ScoutCandidateFilters,
  ScoutCandidateSummary,
  ScoutConflict,
  ScoutDimensionResult,
  ScoutEvidence,
  ScoutEvidenceRequest,
  ScoutEventInput,
  ScoutReview,
} from '@/contracts/scout'
import { recordAuditEvent } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import {
  scoutAssessments,
  scoutCandidates,
  scoutEvidence,
  scoutEvidenceRequests,
  scoutEvents,
  scoutReviews,
  users,
} from '@/server/db/schema'
import { assessCandidate, reviewOrder } from '@/server/scout-rubric'
import { invalidTransition, notFound } from '@/server/service-errors'

type CandidateRow = typeof scoutCandidates.$inferSelect
type EvidenceRow = typeof scoutEvidence.$inferSelect
type AssessmentRow = typeof scoutAssessments.$inferSelect

/**
 * Decisions that end a candidate's life.
 *
 * `quarantined` is set by the pipeline when the subject looked like a natural
 * person, and a reviewer may not overturn it: re-opening it would mean asking
 * somebody to look at the personal data the quarantine exists to avoid keeping.
 * `accepted` is terminal for this version of the candidate, so a later change
 * of mind is a new assessment rather than a quiet edit of a recorded decision.
 */
const closedStates = new Set(['quarantined', 'accepted'])

const decisionStates = {
  accept: 'accepted',
  watch: 'watch',
  reject: 'rejected',
  needs_evidence: 'needs_evidence',
} as const

function toEvidence(row: EvidenceRow): ScoutEvidence {
  return {
    id: row.id,
    field: row.field,
    value: row.value,
    sourceUrl: row.sourceUrl,
    sourceTitle: row.sourceTitle,
    extractionMethod: row.extractionMethod,
    extractorVersion: row.extractorVersion,
    certainty: row.certainty,
    excerpt: row.excerpt,
    observedAt: row.observedAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    supersededAt: row.supersededAt?.toISOString() ?? null,
  }
}

function toAssessment(row: AssessmentRow): ScoutAssessment {
  return {
    id: row.id,
    rubricVersion: row.rubricVersion,
    gate: row.gate,
    gateReason: row.gateReason,
    dimensions: row.dimensions as ScoutDimensionResult[],
    conflicts: row.conflicts as ScoutConflict[],
    distinctSources: row.distinctSources,
    calculatedAt: row.calculatedAt.toISOString(),
  }
}

function toSummary(
  row: CandidateRow,
  assessment: ScoutAssessment | null,
  evidenceCount: number
): ScoutCandidateSummary {
  return {
    id: row.id,
    entityType: row.entityType,
    displayName: row.displayName,
    domain: row.domain,
    summary: row.summary,
    reviewState: row.reviewState,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastObservedAt: row.lastObservedAt.toISOString(),
    assessment,
    evidenceCount,
  }
}

/**
 * Recalculates and stores the current assessment.
 *
 * The previous row is superseded rather than updated, because a review points
 * at the exact assessment its reviewer saw. Editing it in place would rewrite
 * the reason a past decision was made.
 */
export async function refreshScoutAssessment(
  candidateId: string
): Promise<ScoutAssessment> {
  const evidenceRows = await db
    .select()
    .from(scoutEvidence)
    .where(eq(scoutEvidence.candidateId, candidateId))

  const result = assessCandidate(evidenceRows.map(toEvidence))

  return db.transaction(async (transaction) => {
    await transaction
      .update(scoutAssessments)
      .set({ supersededAt: new Date() })
      .where(
        and(
          eq(scoutAssessments.candidateId, candidateId),
          isNull(scoutAssessments.supersededAt)
        )
      )

    const [row] = await transaction
      .insert(scoutAssessments)
      .values({
        candidateId,
        rubricVersion: result.rubricVersion,
        gate: result.gate,
        gateReason: result.gateReason,
        dimensions: result.dimensions,
        conflicts: result.conflicts,
        distinctSources: result.distinctSources,
      })
      .returning()

    if (!row) throw new Error('The assessment was not stored.')
    return toAssessment(row)
  })
}

export async function listScoutCandidates(
  filters: Readonly<ScoutCandidateFilters> = {}
): Promise<ScoutCandidateSummary[]> {
  const conditions: SQL[] = []
  if (filters.state) {
    conditions.push(eq(scoutCandidates.reviewState, filters.state))
  }
  if (filters.entityType) {
    conditions.push(eq(scoutCandidates.entityType, filters.entityType))
  }
  if (filters.q) {
    // Escaped so a query containing % or _ searches for those characters
    // rather than matching everything.
    const pattern = `%${filters.q.replace(/[\\%_]/g, (match) => `\\${match}`)}%`
    const match = or(
      ilike(scoutCandidates.displayName, pattern),
      ilike(scoutCandidates.domain, pattern),
      ilike(scoutCandidates.summary, pattern)
    )
    if (match) conditions.push(match)
  }

  const rows = await db
    .select({
      candidate: scoutCandidates,
      assessment: scoutAssessments,
    })
    .from(scoutCandidates)
    .leftJoin(
      scoutAssessments,
      and(
        eq(scoutAssessments.candidateId, scoutCandidates.id),
        isNull(scoutAssessments.supersededAt)
      )
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(scoutCandidates.lastObservedAt))

  if (rows.length === 0) return []

  const counts = await db
    .select({
      candidateId: scoutEvidence.candidateId,
      total: count(),
    })
    .from(scoutEvidence)
    .groupBy(scoutEvidence.candidateId)

  const countByCandidate = new Map(
    counts.map((row) => [row.candidateId, Number(row.total)])
  )

  const summaries = rows.map(({ candidate, assessment }) =>
    toSummary(
      candidate,
      assessment ? toAssessment(assessment) : null,
      countByCandidate.get(candidate.id) ?? 0
    )
  )

  // Ordered by what a reviewer can act on rather than by a score: conflicts
  // first, then candidates ready to decide, then the ones that are research
  // rather than a decision.
  return [...summaries].sort((left, right) => {
    const order =
      reviewOrder(left.assessment?.gate ?? null) -
      reviewOrder(right.assessment?.gate ?? null)
    if (order !== 0) return order
    return right.lastObservedAt.localeCompare(left.lastObservedAt)
  })
}

export async function getScoutCandidateStateCounts(): Promise<
  Record<CandidateRow['reviewState'], number>
> {
  const rows = await db
    .select({ state: scoutCandidates.reviewState, total: count() })
    .from(scoutCandidates)
    .groupBy(scoutCandidates.reviewState)

  const counts: Record<CandidateRow['reviewState'], number> = {
    needs_review: 0,
    accepted: 0,
    watch: 0,
    rejected: 0,
    needs_evidence: 0,
    quarantined: 0,
  }
  for (const row of rows) counts[row.state] = Number(row.total)
  return counts
}

export async function getScoutCandidate(
  candidateId: string
): Promise<ScoutCandidateDetail> {
  const [candidate] = await db
    .select()
    .from(scoutCandidates)
    .where(eq(scoutCandidates.id, candidateId))
    .limit(1)

  if (!candidate) throw notFound('That candidate no longer exists.')

  const [evidenceRows, assessmentRows, reviewRows, evidenceRequestRows] =
    await Promise.all([
      db
        .select()
        .from(scoutEvidence)
        .where(eq(scoutEvidence.candidateId, candidateId))
        .orderBy(asc(scoutEvidence.field), desc(scoutEvidence.observedAt)),
      db
        .select()
        .from(scoutAssessments)
        .where(
          and(
            eq(scoutAssessments.candidateId, candidateId),
            isNull(scoutAssessments.supersededAt)
          )
        )
        .limit(1),
      db
        .select({
          review: scoutReviews,
          reviewerName: users.displayName,
        })
        .from(scoutReviews)
        .leftJoin(users, eq(scoutReviews.actorUserId, users.id))
        .where(eq(scoutReviews.candidateId, candidateId))
        .orderBy(desc(scoutReviews.reviewedAt)),
      db
        .select({
          request: scoutEvidenceRequests,
          assigneeName: users.displayName,
        })
        .from(scoutEvidenceRequests)
        .leftJoin(users, eq(scoutEvidenceRequests.assignedToUserId, users.id))
        .where(eq(scoutEvidenceRequests.candidateId, candidateId))
        .orderBy(desc(scoutEvidenceRequests.createdAt)),
    ])

  const assessment = assessmentRows[0] ? toAssessment(assessmentRows[0]) : null

  const reviews: ScoutReview[] = reviewRows.map(({ review, reviewerName }) => ({
    id: review.id,
    decision: review.decision,
    reasonCategory: review.reasonCategory as ScoutReview['reasonCategory'],
    reason: review.reason,
    reviewer:
      review.actorUserId && reviewerName
        ? { id: review.actorUserId, displayName: reviewerName }
        : null,
    reviewedAt: review.reviewedAt.toISOString(),
  }))

  const evidenceRequests: ScoutEvidenceRequest[] = evidenceRequestRows.map(
    ({ request, assigneeName }) => ({
      id: request.id,
      fields: request.fields as ScoutEvidenceRequest['fields'],
      note: request.note,
      status: request.status as ScoutEvidenceRequest['status'],
      assignedTo:
        request.assignedToUserId && assigneeName
          ? { id: request.assignedToUserId, displayName: assigneeName }
          : null,
      dueAt: request.dueAt?.toISOString() ?? null,
      createdAt: request.createdAt.toISOString(),
      completedAt: request.completedAt?.toISOString() ?? null,
    })
  )

  return {
    ...toSummary(candidate, assessment, evidenceRows.length),
    evidence: evidenceRows.map(toEvidence),
    reviews,
    evidenceRequests,
  }
}

/**
 * Records a review decision.
 *
 * Accepting writes nothing to the CRM. In this phase there is no code path
 * from Scout into `crm_organisations`, so the boundary the plan describes is
 * enforced by the absence of the writer rather than by a check somebody could
 * forget. The decision is kept so the queue can be worked and so the reasoning
 * survives the reviewer.
 */
export async function recordScoutReview(
  actor: Readonly<ActorContext>,
  candidateId: string,
  input: Readonly<RecordScoutReviewInput>
): Promise<ScoutCandidateDetail> {
  const [existing] = await db
    .select()
    .from(scoutCandidates)
    .where(eq(scoutCandidates.id, candidateId))
    .limit(1)

  if (!existing) throw notFound('That candidate no longer exists.')

  if (closedStates.has(existing.reviewState)) {
    throw invalidTransition(
      existing.reviewState === 'quarantined'
        ? 'A quarantined candidate cannot be reviewed: nothing was kept about it.'
        : 'This candidate has been accepted. A change of mind needs a new assessment.'
    )
  }

  // Assessed before the decision is written, so the review points at the state
  // of the evidence at the moment it was taken rather than at whatever was
  // last calculated.
  const assessment = await refreshScoutAssessment(candidateId)

  await db.transaction(async (transaction) => {
    await transaction.insert(scoutReviews).values({
      candidateId,
      assessmentId: assessment.id,
      decision: input.decision,
      reasonCategory: input.reasonCategory,
      reason: input.reason,
      actorUserId: actor.userId,
      requestId: actor.requestId,
    })

    await transaction
      .update(scoutEvidenceRequests)
      .set({ status: 'completed', completedAt: new Date() })
      .where(
        and(
          eq(scoutEvidenceRequests.candidateId, candidateId),
          eq(scoutEvidenceRequests.status, 'open')
        )
      )

    if (input.decision === 'needs_evidence') {
      await transaction.insert(scoutEvidenceRequests).values({
        candidateId,
        fields: input.evidenceFields ?? [],
        note: input.reason,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        createdByUserId: actor.userId,
      })
    }

    await transaction
      .update(scoutCandidates)
      .set({
        reviewState: decisionStates[input.decision],
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(scoutCandidates.id, candidateId))

    await recordAuditEvent(transaction, actor, {
      action: `scout.candidate.${input.decision}`,
      entityType: 'scout_candidate',
      entityId: candidateId,
      summary: 'No CRM record was created: Scout has no write path into it.',
      changes: {
        reviewState: {
          from: existing.reviewState,
          to: decisionStates[input.decision],
        },
      },
    })

    await transaction.insert(scoutEvents).values({
      eventType: 'review_recorded',
      candidateId,
      actorUserId: actor.userId,
      requestId: actor.requestId,
      metadata: {
        decision: input.decision,
        reasonCategory: input.reasonCategory ?? null,
      },
    })
  })

  return getScoutCandidate(candidateId)
}

export async function recordScoutEvent(
  actor: Readonly<ActorContext>,
  input: Readonly<ScoutEventInput>
): Promise<void> {
  await db.insert(scoutEvents).values({
    eventType: input.eventType,
    candidateId: input.candidateId,
    actorUserId: actor.userId,
    requestId: actor.requestId,
    metadata: input.metadata,
  })
}

/**
 * Applies one decision to several candidates.
 *
 * Each candidate is decided in its own transaction rather than all of them in
 * one: a bulk action that rolls back entirely because the reviewer happened to
 * select an already-accepted candidate would lose the eight decisions that were
 * fine. Undecidable candidates are named by the caller before this runs.
 */
export async function recordScoutReviews(
  actor: Readonly<ActorContext>,
  input: Readonly<BulkScoutReviewInput>
): Promise<{ decided: number }> {
  let decided = 0

  for (const candidateId of input.candidateIds) {
    await recordScoutReview(actor, candidateId, {
      decision: input.decision,
      reason: input.reason,
    })
    decided += 1
  }

  return { decided }
}
