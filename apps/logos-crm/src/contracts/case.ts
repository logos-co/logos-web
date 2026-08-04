import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

import { casePriorities, cases, caseStatuses } from '@/server/db/schema'

export const caseStatusSchema = z.enum(caseStatuses)
export const casePrioritySchema = z.enum(casePriorities)

export const createCaseSchema = createInsertSchema(cases, {
  title: (schema) => schema.trim().min(3).max(160),
  organisation: (schema) => schema.trim().min(2).max(120),
  owner: (schema) => schema.trim().min(2).max(100),
  stage: (schema) => schema.trim().min(2).max(80),
  nextAction: (schema) => schema.trim().min(3).max(240),
})
  .pick({
    title: true,
    organisation: true,
    owner: true,
    stage: true,
    priority: true,
    nextAction: true,
  })
  .extend({
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
