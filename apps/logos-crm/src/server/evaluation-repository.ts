import { asc, eq } from 'drizzle-orm'

import type { CaseRecord } from '@/contracts/case'
import type {
  EvaluationSummary,
  RecordDecisionInput,
  RecordEvaluationInput,
} from '@/contracts/evaluation'
import { CURRENT_CRITERIA_VERSION } from '@/contracts/values'
import { recordAuditEvent } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { getCase } from '@/server/case-repository'
import { db } from '@/server/db'
import { caseEvaluations, cases, users } from '@/server/db/schema'
import { conflict, notFound } from '@/server/service-errors'

export async function getEvaluationSummary(
  caseId: string
): Promise<EvaluationSummary> {
  const rows = await db
    .select({
      id: caseEvaluations.id,
      caseId: caseEvaluations.caseId,
      stage: caseEvaluations.stage,
      score: caseEvaluations.score,
      notes: caseEvaluations.notes,
      criteriaVersion: caseEvaluations.criteriaVersion,
      reviewerUserId: caseEvaluations.reviewerUserId,
      reviewerName: users.displayName,
      recordedAt: caseEvaluations.recordedAt,
      updatedAt: caseEvaluations.updatedAt,
    })
    .from(caseEvaluations)
    .leftJoin(users, eq(caseEvaluations.reviewerUserId, users.id))
    .where(eq(caseEvaluations.caseId, caseId))
    .orderBy(asc(caseEvaluations.recordedAt))

  const scores = rows
    .map((row) => row.score)
    .filter((score): score is number => score !== null)

  return {
    stages: rows.map((row) => ({
      id: row.id,
      caseId: row.caseId,
      stage: row.stage,
      score: row.score,
      notes: row.notes,
      criteriaVersion: row.criteriaVersion,
      reviewer:
        row.reviewerUserId && row.reviewerName
          ? { id: row.reviewerUserId, displayName: row.reviewerName }
          : null,
      recordedAt: row.recordedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    // Averaged over what was actually scored, not over the stages that exist:
    // an unscored stage is a gap in the review, not a zero.
    averageScore:
      scores.length > 0
        ? Math.round(
            (scores.reduce((sum, score) => sum + score, 0) / scores.length) *
              100
          ) / 100
        : null,
    scoredCount: scores.length,
  }
}

/**
 * Records or replaces one stage of a case's evaluation. Re-reviewing a stage
 * overwrites it rather than appending: the audit event carries what changed, so
 * the current view stays readable without losing the trail.
 */
export async function recordEvaluation(
  actor: Readonly<ActorContext>,
  caseId: string,
  input: Readonly<RecordEvaluationInput>
): Promise<EvaluationSummary> {
  await db.transaction(async (transaction) => {
    const [existing] = await transaction
      .select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1)

    if (!existing) throw notFound('The case no longer exists.')

    const [previous] = await transaction
      .select({ score: caseEvaluations.score })
      .from(caseEvaluations)
      .where(eq(caseEvaluations.caseId, caseId))
      .limit(1)

    await transaction
      .insert(caseEvaluations)
      .values({
        caseId,
        stage: input.stage,
        score: input.score ?? null,
        notes: input.notes ?? null,
        criteriaVersion: CURRENT_CRITERIA_VERSION,
        reviewerUserId: actor.userId,
      })
      .onConflictDoUpdate({
        target: [caseEvaluations.caseId, caseEvaluations.stage],
        set: {
          score: input.score ?? null,
          notes: input.notes ?? null,
          criteriaVersion: CURRENT_CRITERIA_VERSION,
          reviewerUserId: actor.userId,
          updatedAt: new Date(),
        },
      })

    await recordAuditEvent(transaction, actor, {
      action: 'case.evaluation_recorded',
      entityType: 'case',
      entityId: caseId,
      summary: input.stage,
      changes: {
        score: { from: previous?.score ?? null, to: input.score ?? null },
      },
    })
  })

  return getEvaluationSummary(caseId)
}

/**
 * Records the outcome of the review. The decision lives on the case so queues
 * and reports can count it, and is audited with its reason so "why was this
 * redirected" survives the people who decided it.
 */
export async function recordDecision(
  actor: Readonly<ActorContext>,
  caseId: string,
  input: Readonly<RecordDecisionInput>
): Promise<CaseRecord> {
  await db.transaction(async (transaction) => {
    const [current] = await transaction
      .select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1)
      .for('update')

    if (!current) throw notFound('The case no longer exists.')
    if (current.version !== input.expectedVersion) {
      throw conflict(
        'The case changed since it was loaded. Reload it and try again.'
      )
    }

    const decided = input.decision !== 'pending'

    await transaction
      .update(cases)
      .set({
        decision: input.decision,
        decisionReason: input.reason ?? null,
        decidedAt: decided ? new Date() : null,
        decidedByUserId: decided ? actor.userId : null,
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, caseId))

    await recordAuditEvent(transaction, actor, {
      action: 'case.decision_recorded',
      entityType: 'case',
      entityId: caseId,
      summary: input.reason ?? undefined,
      changes: {
        decision: { from: current.decision, to: input.decision },
      },
    })
  })

  const record = await getCase(caseId)
  if (!record) throw notFound('The case no longer exists.')
  return record
}
