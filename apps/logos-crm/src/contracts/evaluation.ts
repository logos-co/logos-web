import { z } from 'zod/v4'

import {
  caseDecisions,
  evaluationStages,
  EVALUATION_SCORE_MAX,
  EVALUATION_SCORE_MIN,
} from './values'

export const evaluationStageSchema = z.enum(evaluationStages)
export const caseDecisionSchema = z.enum(caseDecisions)

export const evaluationStageLabels: Record<
  (typeof evaluationStages)[number],
  string
> = {
  submission: 'Submission',
  call: 'Call',
  one_pager: 'One pager',
  other: 'Other notes',
}

export const caseDecisionLabels: Record<
  (typeof caseDecisions)[number],
  string
> = {
  pending: 'Not decided',
  approved: 'Approved',
  redirected: 'Redirected',
  declined: 'Declined',
}

/**
 * A stage can be recorded with notes and no score: "we spoke, here is what
 * happened, it is too early to rate" is a real review outcome, and forcing a
 * number would manufacture precision.
 */
export const recordEvaluationSchema = z.object({
  stage: evaluationStageSchema,
  score: z
    .number()
    .int()
    .min(EVALUATION_SCORE_MIN)
    .max(EVALUATION_SCORE_MAX)
    .nullable()
    .optional(),
  notes: z.string().trim().max(5_000).nullable().optional(),
})

/**
 * A decision needs a reason whenever it is not the neutral state. "Redirected"
 * without a why is the answer applicants ask about six months later.
 */
export const recordDecisionSchema = z
  .object({
    decision: caseDecisionSchema,
    reason: z.string().trim().max(1_000).optional(),
    expectedVersion: z.number().int().positive(),
  })
  .refine(
    (value) => value.decision === 'pending' || Boolean(value.reason?.length),
    { message: 'Give a reason for the decision.', path: ['reason'] }
  )

export const evaluationRecordSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  stage: evaluationStageSchema,
  score: z.number().int().nullable(),
  notes: z.string().nullable(),
  criteriaVersion: z.string(),
  reviewer: z
    .object({ id: z.string().uuid(), displayName: z.string() })
    .nullable(),
  recordedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const evaluationSummarySchema = z.object({
  stages: z.array(evaluationRecordSchema),
  /** Mean of the recorded scores, or null when nothing has been scored yet. */
  averageScore: z.number().nullable(),
  scoredCount: z.number().int().nonnegative(),
})

export type CaseDecision = z.infer<typeof caseDecisionSchema>
export type EvaluationRecord = z.infer<typeof evaluationRecordSchema>
export type EvaluationStage = z.infer<typeof evaluationStageSchema>
export type EvaluationSummary = z.infer<typeof evaluationSummarySchema>
export type RecordDecisionInput = z.infer<typeof recordDecisionSchema>
export type RecordEvaluationInput = z.infer<typeof recordEvaluationSchema>
