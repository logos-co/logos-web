import { z } from 'zod/v4'

/** Why two records look like the same thing, shown so the reviewer can judge. */
export const duplicateReasons = [
  'same_email',
  'same_name',
  'same_domain',
] as const

export const duplicateReasonLabels: Record<
  (typeof duplicateReasons)[number],
  string
> = {
  same_email: 'Same email address',
  same_name: 'Same name',
  same_domain: 'Same domain',
}

export const duplicateSuggestionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  subtitle: z.string().nullable(),
  reason: z.enum(duplicateReasons),
})

/**
 * Merging moves links and archives the duplicate; it does not delete anything.
 * `expectedVersion` guards the survivor the same way every other edit does, and
 * the reason is recorded because "why are these the same person" is the
 * question the next reviewer will ask.
 */
export const mergeRequestSchema = z.object({
  survivorId: z.string().uuid(),
  duplicateId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
})

export type DuplicateReason = (typeof duplicateReasons)[number]
export type DuplicateSuggestion = z.infer<typeof duplicateSuggestionSchema>
export type MergeRequest = z.infer<typeof mergeRequestSchema>
