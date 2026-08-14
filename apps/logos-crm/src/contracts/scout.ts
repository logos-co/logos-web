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

export const scoutReviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(scoutReviewDecisions),
  reason: z.string(),
  reviewer: z
    .object({ id: z.string().uuid(), displayName: z.string() })
    .nullable(),
  reviewedAt: z.string(),
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
})

/**
 * Filters the inbox actually needs. There is no free-text query: a candidate
 * list somebody can search by arbitrary string is one step from a people
 * search, and nothing in this phase has enough rows to need it.
 */
export const scoutCandidateFiltersSchema = z.object({
  state: z.enum(scoutReviewStates).optional(),
  entityType: z.enum(scoutEntityTypes).optional(),
})

/**
 * A reason is required for every decision, not only acceptance. "Rejected"
 * without a reason is the state that later gets re-discovered, re-reviewed,
 * and rejected again by somebody who cannot see why.
 */
export const recordScoutReviewSchema = z.object({
  decision: z.enum(scoutReviewDecisions),
  reason: z.string().trim().min(3).max(500),
})

export type ScoutEvidence = z.infer<typeof scoutEvidenceSchema>
export type ScoutDimensionResult = z.infer<typeof scoutDimensionResultSchema>
export type ScoutConflict = z.infer<typeof scoutConflictSchema>
export type ScoutAssessment = z.infer<typeof scoutAssessmentSchema>
export type ScoutReview = z.infer<typeof scoutReviewSchema>
export type ScoutCandidateSummary = z.infer<typeof scoutCandidateSummarySchema>
export type ScoutCandidateDetail = z.infer<typeof scoutCandidateDetailSchema>
export type ScoutCandidateFilters = z.infer<typeof scoutCandidateFiltersSchema>
export type RecordScoutReviewInput = z.infer<typeof recordScoutReviewSchema>
