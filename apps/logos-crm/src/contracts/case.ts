import { z } from 'zod/v4'

import { isStageOf, pipelineKeySchema } from './pipeline'
import { caseDecisions, casePriorities, caseStatuses } from './values'

export const caseStatusSchema = z.enum(caseStatuses)
export const casePrioritySchema = z.enum(casePriorities)

export const caseActorSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
})

/**
 * `ownerUserId` and the next-action pair are optional: a case captured from
 * intake is unassigned and untriaged until someone picks it up, and inventing
 * placeholder values to satisfy a NOT NULL would corrupt the queues built on
 * them.
 */
export const createCaseSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    ownerUserId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    pipeline: pipelineKeySchema,
    stage: z.string().trim().min(2).max(80),
    priority: casePrioritySchema,
    nextAction: z.string().trim().min(3).max(240).optional(),
    nextActionAt: z.string().datetime().optional(),
    organisationId: z.string().uuid().optional(),
    personIds: z.array(z.string().uuid()).max(12).default([]),
  })
  .refine((value) => isStageOf(value.pipeline, value.stage), {
    path: ['stage'],
    message: 'The stage does not belong to the selected pipeline.',
  })

/**
 * Moving a case along its board. The pipeline is not accepted here: a case
 * changes stage far more often than it changes team, and letting one request
 * do both means a dropped card could silently move a case onto another team's
 * board. Re-piping is a separate, deliberate action.
 */
export const updateCaseStageSchema = z.object({
  stage: z.string().trim().min(2).max(80),
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().max(500).optional(),
})

/**
 * `expectedVersion` is the optimistic-concurrency token. It is required, not
 * optional: a status change submitted from a stale screen must fail loudly
 * rather than overwrite a transition the caller never saw.
 */
export const updateCaseStatusSchema = z.object({
  status: caseStatusSchema,
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().max(500).optional(),
})

/**
 * The queues a coordinator actually works from. They are server-side
 * predicates, not client-side filters over a fetched page: "everything overdue"
 * has to mean everything, not everything on screen.
 *
 * `overdue` is derived from open tasks rather than a column on the case,
 * because the task is what someone committed to. `stale` is derived from
 * contact-type activity, so a case nobody has contacted surfaces even when it
 * has notes on it.
 */
export const caseQueues = [
  'all',
  'mine',
  'unassigned',
  'needs_triage',
  'needs_review',
  'overdue',
  'stale',
] as const

export const caseQueueSchema = z.enum(caseQueues)

export const caseListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: caseStatusSchema.optional(),
  queue: caseQueueSchema.default('all'),
  ownerUserId: z.string().uuid().optional(),
  pipeline: pipelineKeySchema.optional(),
})

/**
 * The earliest open task on a case. This is what the screens show as the next
 * action: the case's own free-text field can drift from the task somebody is
 * actually accountable for, and two answers to "what happens next" is one too
 * many.
 */
export const caseNextTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  dueAt: z.string().datetime(),
  assignee: caseActorSchema.nullable(),
})

export const caseRecordSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  nextTask: caseNextTaskSchema.nullable(),
  openTaskCount: z.number().int().nonnegative(),
  organisationId: z.string().uuid().nullable(),
  organisationName: z.string().nullable(),
  owner: caseActorSchema.nullable(),
  status: caseStatusSchema,
  pipeline: pipelineKeySchema,
  stage: z.string(),
  priority: casePrioritySchema,
  nextAction: z.string().nullable(),
  nextActionAt: z.string().datetime().nullable(),
  lastContactAt: z.string().datetime().nullable(),
  /** Where the applicant said they heard about Logos, and which funnel. */
  leadSource: z.string().nullable(),
  profile: z.string().nullable(),
  decision: z.enum(caseDecisions),
  decisionReason: z.string().nullable(),
  decidedAt: z.string().datetime().nullable(),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  relatedPeople: z.array(
    z.object({
      id: z.string().uuid(),
      fullName: z.string(),
      roleTitle: z.string().nullable(),
      // Carried here so screens that offer to contact somebody can see the
      // instruction not to, without a second lookup they might forget.
      doNotContact: z.boolean(),
    })
  ),
})

export type CaseActor = z.infer<typeof caseActorSchema>
export type CaseNextTask = z.infer<typeof caseNextTaskSchema>
export type CasePriority = z.infer<typeof casePrioritySchema>
export type CaseQueue = z.infer<typeof caseQueueSchema>
export type CaseListQuery = z.infer<typeof caseListQuerySchema>
export type CaseRecord = z.infer<typeof caseRecordSchema>
export type CaseStatus = z.infer<typeof caseStatusSchema>
export type CreateCaseInput = z.infer<typeof createCaseSchema>
export type UpdateCaseStageInput = z.infer<typeof updateCaseStageSchema>
export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>
