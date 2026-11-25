import { z } from 'zod/v4'

export const listPageSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(500),
  offset: z.coerce.number().int().min(0).default(0),
})

export type ListPage = z.infer<typeof listPageSchema>
