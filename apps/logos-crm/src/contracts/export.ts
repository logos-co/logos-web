import { z } from 'zod/v4'

import { reportQuerySchema } from './report'

/**
 * What can be exported. A closed list rather than a resource name from the
 * request: a client that could name its own resource could name any table.
 */
export const exportResources = ['cases', 'report_funnel'] as const

export const exportResourceLabels: Record<
  (typeof exportResources)[number],
  string
> = {
  cases: 'Case list',
  report_funnel: 'Funnel report',
}

/** Files hold personal data, so they expire rather than accumulate. */
export const EXPORT_RETENTION_HOURS = 24

export const createExportSchema = z.discriminatedUnion('resource', [
  z.object({
    resource: z.literal('cases'),
    filters: z.object({
      q: z.string().trim().max(120).optional(),
      status: z.string().trim().max(40).optional(),
      queue: z.string().trim().max(40).optional(),
    }),
  }),
  z.object({
    resource: z.literal('report_funnel'),
    filters: reportQuerySchema,
  }),
])

export const exportJobRecordSchema = z.object({
  id: z.string().uuid(),
  resource: z.enum(exportResources),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'expired']),
  rowCount: z.number().int().nullable(),
  requestedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  error: z.string().nullable(),
})

export type CreateExportInput = z.infer<typeof createExportSchema>
export type ExportJobRecord = z.infer<typeof exportJobRecordSchema>
export type ExportResource = (typeof exportResources)[number]
