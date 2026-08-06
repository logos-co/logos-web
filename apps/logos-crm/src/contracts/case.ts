import { z } from 'zod/v4'

import { casePriorities, caseStatuses } from './values'

export const caseStatusSchema = z.enum(caseStatuses)
export const casePrioritySchema = z.enum(casePriorities)

export const createCaseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  organisation: z.string().trim().min(2).max(120),
  owner: z.string().trim().min(2).max(100),
  stage: z.string().trim().min(2).max(80),
  priority: casePrioritySchema,
  nextAction: z.string().trim().min(3).max(240),
  nextActionAt: z.string().datetime(),
  organisationId: z.string().uuid().optional(),
  personIds: z.array(z.string().uuid()).max(12).default([]),
})

export const updateCaseStatusSchema = z.object({
  status: caseStatusSchema,
})

export const caseListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: caseStatusSchema.optional(),
})

export const caseRecordSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  organisation: z.string(),
  organisationId: z.string().uuid().nullable(),
  owner: z.string(),
  status: caseStatusSchema,
  stage: z.string(),
  priority: casePrioritySchema,
  nextAction: z.string(),
  nextActionAt: z.string().datetime(),
  lastContactAt: z.string().datetime().nullable(),
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

export type CasePriority = z.infer<typeof casePrioritySchema>
export type CaseRecord = z.infer<typeof caseRecordSchema>
export type CaseStatus = z.infer<typeof caseStatusSchema>
export type CreateCaseInput = z.infer<typeof createCaseSchema>
