import { z } from 'zod/v4'

import { privacyRequestStatuses, privacyRequestTypes } from './values'

export const privacyRequestTypeSchema = z.enum(privacyRequestTypes)
export const privacyRequestStatusSchema = z.enum(privacyRequestStatuses)

export const privacyRequestTypeLabels: Record<
  (typeof privacyRequestTypes)[number],
  string
> = {
  access: 'Access',
  rectification: 'Rectification',
  erasure: 'Erasure',
  objection: 'Objection',
}

export const privacyRequestStatusLabels: Record<
  (typeof privacyRequestStatuses)[number],
  string
> = {
  received: 'Received',
  in_progress: 'In progress',
  completed: 'Completed',
  refused: 'Refused',
}

/**
 * Suppression needs a reason for the same purpose a decision does: somebody
 * will ask why this person stopped being contacted, and "it was ticked" is not
 * an answer.
 */
export const setDoNotContactSchema = z.object({
  doNotContact: z.boolean(),
  reason: z.string().trim().max(500).optional(),
})

export const createPrivacyRequestSchema = z.object({
  type: privacyRequestTypeSchema,
  notes: z.string().trim().max(2_000).optional(),
})

export const updatePrivacyRequestSchema = z.object({
  status: privacyRequestStatusSchema,
  notes: z.string().trim().max(2_000).optional(),
})

export const privacyRequestRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  type: privacyRequestTypeSchema,
  status: privacyRequestStatusSchema,
  receivedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  notes: z.string().nullable(),
})

export const privacyStateSchema = z.object({
  doNotContact: z.boolean(),
  doNotContactAt: z.string().datetime().nullable(),
  doNotContactReason: z.string().nullable(),
  anonymisedAt: z.string().datetime().nullable(),
  requests: z.array(privacyRequestRecordSchema),
})

export type CreatePrivacyRequestInput = z.infer<
  typeof createPrivacyRequestSchema
>
export type PrivacyRequestRecord = z.infer<typeof privacyRequestRecordSchema>
export type PrivacyState = z.infer<typeof privacyStateSchema>
export type SetDoNotContactInput = z.infer<typeof setDoNotContactSchema>
export type UpdatePrivacyRequestInput = z.infer<
  typeof updatePrivacyRequestSchema
>
