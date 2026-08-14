import { z } from 'zod/v4'

/**
 * Global search answers "where is this person/case/organisation", not "give me
 * a filtered list". It returns a few results per kind so the answer fits on one
 * screen; narrowing belongs to the list views, which have real filters.
 */
export const SEARCH_GROUP_LIMIT = 5

/** Two characters is the shortest query that narrows anything useful. */
export const SEARCH_MIN_LENGTH = 2

export const searchQuerySchema = z.object({
  q: z.string().trim().min(SEARCH_MIN_LENGTH).max(120),
})

export const searchHitSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  /** What matched, so a hit on an email address is not a mystery. */
  subtitle: z.string().nullable(),
  href: z.string(),
})

export const searchResultSchema = z.object({
  cases: z.array(searchHitSchema),
  people: z.array(searchHitSchema),
  organisations: z.array(searchHitSchema),
  total: z.number().int().nonnegative(),
})

export type SearchHit = z.infer<typeof searchHitSchema>
export type SearchQuery = z.infer<typeof searchQuerySchema>
export type SearchResult = z.infer<typeof searchResultSchema>
