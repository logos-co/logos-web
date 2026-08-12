import { z } from 'zod/v4'

import { casePriorities, caseStatuses } from './values'

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
export const createCaseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  ownerUserId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  stage: z.string().trim().min(2).max(80),
  priority: casePrioritySchema,
  nextAction: z.string().trim().min(3).max(240).optional(),
  nextActionAt: z.string().datetime().optional(),
  organisationId: z.string().uuid().optional(),
  personIds: z.array(z.string().uuid()).max(12).default([]),
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

export const caseListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: caseStatusSchema.optional(),
})

export const caseRecordSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  organisationId: z.string().uuid().nullable(),
  organisationName: z.string().nullable(),
  owner: caseActorSchema.nullable(),
  status: caseStatusSchema,
  stage: z.string(),
  priority: casePrioritySchema,
  nextAction: z.string().nullable(),
  nextActionAt: z.string().datetime().nullable(),
  lastContactAt: z.string().datetime().nullable(),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  relatedPeople: z.array(
    z.object({
      id: z.string().uuid(),
      fullName: z.string(),
      roleTitle: z.string().nullable(),
    })
  ),
})

export type CaseActor = z.infer<typeof caseActorSchema>
export type CasePriority = z.infer<typeof casePrioritySchema>
export type CaseRecord = z.infer<typeof caseRecordSchema>
export type CaseStatus = z.infer<typeof caseStatusSchema>
export type CreateCaseInput = z.infer<typeof createCaseSchema>
export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>
