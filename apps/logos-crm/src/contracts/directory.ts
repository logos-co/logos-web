import { z } from 'zod/v4'

import { directoryStatuses } from './values'

export const directoryStatusSchema = z.enum(directoryStatuses)

export const directoryListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
})

export const createOrganisationSchema = z.object({
  displayName: z.string().trim().min(2).max(140),
  domain: z.string().trim().max(160).optional(),
  website: z
    .union([z.string().trim().url().max(240), z.literal('')])
    .optional(),
  status: directoryStatusSchema.optional(),
  summary: z.string().trim().max(600).optional(),
})

export const createPersonSchema = z.object({
  fullName: z.string().trim().min(2).max(140),
  preferredName: z.string().trim().max(100).optional(),
  roleTitle: z.string().trim().max(140).optional(),
  status: directoryStatusSchema.optional(),
  summary: z.string().trim().max(600).optional(),
  email: z
    .union([z.string().trim().email().max(240), z.literal('')])
    .optional(),
  phone: z.string().trim().max(80).optional(),
  organisationId: z.string().uuid().optional(),
})

export const updateOrganisationSchema = createOrganisationSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  })

export const updatePersonSchema = createPersonSchema
  .partial()
  .extend({ organisationId: z.string().uuid().nullable().optional() })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  })

export const organisationRecordSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  domain: z.string().nullable(),
  website: z.string().nullable(),
  status: directoryStatusSchema,
  summary: z.string().nullable(),
  contactCount: z.number().int().nonnegative(),
  linkedCaseCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const personRecordSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  preferredName: z.string().nullable(),
  roleTitle: z.string().nullable(),
  status: directoryStatusSchema,
  summary: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  organisationId: z.string().uuid().nullable(),
  organisationName: z.string().nullable(),
  linkedCaseCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>
export type CreatePersonInput = z.infer<typeof createPersonSchema>
export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>
export type DirectoryStatus = z.infer<typeof directoryStatusSchema>
export type OrganisationRecord = z.infer<typeof organisationRecordSchema>
export type PersonRecord = z.infer<typeof personRecordSchema>
