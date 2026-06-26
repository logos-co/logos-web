import { z } from 'zod'

import { languageSchema, schemaVersion, slugSchema } from './common'

/**
 * One entry in the Field Guide table of contents. `num` is the display index
 * shown beside the title (e.g. "00", "07") — a zero-padded string, not a
 * number, so leading zeros survive.
 */
export const fieldGuideItemSchema = z.object({
  slug: slugSchema,
  num: z.string().regex(/^\d{2}$/, 'num must be a two-digit string'),
  title: z.string().min(1),
})
export type FieldGuideItem = z.infer<typeof fieldGuideItemSchema>

export const fieldGuideSectionSchema = z.object({
  section: z.string().min(1),
  items: z.array(fieldGuideItemSchema).min(1),
})
export type FieldGuideSection = z.infer<typeof fieldGuideSectionSchema>

/**
 * The Field Guide manifest: guide metadata plus the ordered chapter list.
 * It is the single source for the sidebar, the prev/next pager order, the
 * page-reference label, and static-param generation. Chapter bodies live as
 * sibling Markdown files (`chapters/<slug>.md`), not in this manifest.
 */
export const fieldGuideManifestSchema = z.object({
  schemaVersion: schemaVersion(1),
  language: languageSchema,
  title: z.string().min(1),
  version: z.string().min(1),
  sections: z.array(fieldGuideSectionSchema).min(1),
})
export type FieldGuideManifest = z.infer<typeof fieldGuideManifestSchema>
