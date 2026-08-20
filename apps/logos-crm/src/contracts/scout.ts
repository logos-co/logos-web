import { z } from 'zod/v4'

import {
  scoutBands,
  scoutCertainties,
  scoutDimensions,
  scoutEntityTypes,
  scoutEvidenceFields,
  scoutExtractionMethods,
  scoutGates,
  scoutReviewDecisions,
  scoutReviewStates,
} from './values'

export const scoutEvidenceSchema = z.object({
  id: z.string().uuid(),
  field: z.enum(scoutEvidenceFields),
  value: z.string(),
  sourceUrl: z.string(),
  sourceTitle: z.string().nullable(),
  extractionMethod: z.enum(scoutExtractionMethods),
  /**
   * Which extractor produced the value. A method alone cannot be reproduced
   * once a model or parser changes, and an unreproducible fact cannot be
   * audited later, which is what the evidence is for.
   */
  extractorVersion: z.string(),
  certainty: z.enum(scoutCertainties),
  /** The part of the source the value came from, quoted for the reviewer. */
  excerpt: z.string(),
  observedAt: z.string(),
  expiresAt: z.string().nullable(),
  supersededAt: z.string().nullable(),
})

export const scoutDimensionResultSchema = z.object({
  dimension: z.enum(scoutDimensions),
  band: z.enum(scoutBands),
  /** Why the band is what it is, in the reviewer's words rather than points. */
  reason: z.string(),
  evidenceIds: z.array(z.string().uuid()),
})

export const scoutConflictSchema = z.object({
  field: z.enum(scoutEvidenceFields),
  values: z.array(z.string()),
  evidenceIds: z.array(z.string().uuid()),
})

export const scoutAssessmentSchema = z.object({
  id: z.string().uuid(),
  rubricVersion: z.string(),
  gate: z.enum(scoutGates),
  gateReason: z.string(),
  dimensions: z.array(scoutDimensionResultSchema),
  conflicts: z.array(scoutConflictSchema),
  distinctSources: z.number().int().nonnegative(),
  calculatedAt: z.string(),
})

export const scoutReasonCategories = [
  'relevant_work',
  'active_project',
  'duplicate',
  'out_of_scope',
  'insufficient_evidence',
  'other',
] as const

export const scoutReviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(scoutReviewDecisions),
  reasonCategory: z.enum(scoutReasonCategories).nullable(),
  reason: z.string(),
  reviewer: z
    .object({ id: z.string().uuid(), displayName: z.string() })
    .nullable(),
  reviewedAt: z.string(),
})

export const scoutEvidenceRequestSchema = z.object({
  id: z.string().uuid(),
  fields: z.array(z.enum(scoutEvidenceFields)),
  note: z.string(),
  status: z.enum(['open', 'completed']),
  assignedTo: z
    .object({ id: z.string().uuid(), displayName: z.string() })
    .nullable(),
  dueAt: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
})

export const scoutCandidateSummarySchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum(scoutEntityTypes),
  displayName: z.string(),
  domain: z.string().nullable(),
  summary: z.string().nullable(),
  reviewState: z.enum(scoutReviewStates),
  firstSeenAt: z.string(),
  lastObservedAt: z.string(),
  assessment: scoutAssessmentSchema.nullable(),
  evidenceCount: z.number().int().nonnegative(),
})

export const scoutCandidateDetailSchema = scoutCandidateSummarySchema.extend({
  evidence: z.array(scoutEvidenceSchema),
  reviews: z.array(scoutReviewSchema),
  evidenceRequests: z.array(scoutEvidenceRequestSchema),
  assignedTo: z
    .object({ id: z.string().uuid(), displayName: z.string() })
    .nullable(),
  internalNote: z.string().nullable(),
  reviewAfterAt: z.string().nullable(),
  crmMatch: z
    .object({
      id: z.string().uuid(),
      displayName: z.string(),
      domain: z.string().nullable(),
    })
    .nullable(),
})

/**
 * Inbox filters.
 *
 * `q` matches the candidate's name, domain, and summary and nothing else. It
 * is deliberately not a search across evidence: evidence is where a free-text
 * query would start returning people who happen to be named in a source, and
 * the queue is a list of organisations.
 */
export const scoutCandidateFiltersSchema = z.object({
  state: z.enum(scoutReviewStates).optional(),
  entityType: z.enum(scoutEntityTypes).optional(),
  q: z.string().trim().min(2).max(80).optional(),
})

/**
 * A reason is required for every decision, not only acceptance. "Rejected"
 * without a reason is the state that later gets re-discovered, re-reviewed,
 * and rejected again by somebody who cannot see why.
 */
export const recordScoutReviewSchema = z
  .object({
    decision: z.enum(scoutReviewDecisions),
    reasonCategory: z.enum(scoutReasonCategories).optional(),
    reason: z.string().trim().min(3).max(500),
    evidenceFields: z.array(z.enum(scoutEvidenceFields)).max(12).optional(),
    dueAt: z.iso.datetime().optional(),
    reviewAfterAt: z.iso.datetime().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.decision === 'needs_evidence' &&
      (value.evidenceFields?.length ?? 0) === 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Select at least one missing evidence field.',
        path: ['evidenceFields'],
      })
    }
  })

/**
 * Deciding on several candidates at once.
 *
 * The reason applies to all of them, which is the honest shape: a reviewer
 * clearing eight irrelevant candidates has one reason, and asking them to type
 * it eight times produces eight copies of "not relevant" rather than eight
 * considered decisions. Acceptance is excluded - taking a candidate forward is
 * a per-candidate judgement, and a bulk accept is how a queue turns into a
 * list nobody read.
 */
export const bulkScoutReviewSchema = z.object({
  candidateIds: z.array(z.string().uuid()).min(1).max(50),
  // Evidence requests need candidate-specific missing fields, so they cannot
  // honestly share one bulk payload.
  decision: z.enum(['watch', 'reject']),
  reason: z.string().trim().min(3).max(500),
})

export const scoutDiscoveryRunSchema = z.object({
  id: z.string().uuid(),
  briefId: z.string().uuid().nullable(),
  mode: z.string(),
  discoveredCount: z.number().int().nonnegative(),
  quarantinedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  sourcesUsed: z.array(z.string()),
  note: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
})

export const updateScoutCandidateOperationsSchema = z.object({
  assignedToUserId: z.string().uuid().nullable(),
  internalNote: z.string().trim().max(2000).nullable(),
  reviewAfterAt: z.iso.datetime().nullable(),
})

const shortListSchema = z.array(z.string().trim().min(1).max(80)).max(12)

export const scoutDiscoveryBriefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  purpose: z.string(),
  query: z.string(),
  organisationTypes: shortListSchema,
  themes: shortListSchema,
  exclusions: shortListSchema,
  regions: shortListSchema,
  activeWithinMonths: z.number().int().min(1).max(120).nullable(),
  sourceTypes: shortListSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createScoutDiscoveryBriefSchema = scoutDiscoveryBriefSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().trim().min(3).max(100),
    purpose: z.string().trim().min(3).max(500),
    query: z.string().trim().min(2).max(160),
  })

export const scoutEventSchema = z.object({
  eventType: z.enum(['candidate_opened', 'source_opened', 'comparison_opened']),
  candidateId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export type ScoutEvidence = z.infer<typeof scoutEvidenceSchema>
export type ScoutDimensionResult = z.infer<typeof scoutDimensionResultSchema>
export type ScoutConflict = z.infer<typeof scoutConflictSchema>
export type ScoutAssessment = z.infer<typeof scoutAssessmentSchema>
export type ScoutReview = z.infer<typeof scoutReviewSchema>
export type ScoutEvidenceRequest = z.infer<typeof scoutEvidenceRequestSchema>
export type ScoutCandidateSummary = z.infer<typeof scoutCandidateSummarySchema>
export type ScoutCandidateDetail = z.infer<typeof scoutCandidateDetailSchema>
export type ScoutCandidateFilters = z.infer<typeof scoutCandidateFiltersSchema>
export type RecordScoutReviewInput = z.infer<typeof recordScoutReviewSchema>
export type BulkScoutReviewInput = z.infer<typeof bulkScoutReviewSchema>
export type ScoutDiscoveryRun = z.infer<typeof scoutDiscoveryRunSchema>
export type ScoutDiscoveryBrief = z.infer<typeof scoutDiscoveryBriefSchema>
export type CreateScoutDiscoveryBriefInput = z.infer<
  typeof createScoutDiscoveryBriefSchema
>
export type ScoutEventInput = z.infer<typeof scoutEventSchema>
export type UpdateScoutCandidateOperationsInput = z.infer<
  typeof updateScoutCandidateOperationsSchema
>
