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
 * UI chrome labels for the reading shell (pager, aria-labels, theme toggle).
 * Kept in the manifest so all Field Guide copy lives in one content source
 * rather than scattered next-intl keys.
 */
export const fieldGuideUiSchema = z.object({
  previous: z.string().min(1),
  next: z.string().min(1),
  startOfGuide: z.string().min(1),
  endOfGuide: z.string().min(1),
  chaptersNavLabel: z.string().min(1),
  chapterNavLabel: z.string().min(1),
  openChapterList: z.string().min(1),
  closeChapterList: z.string().min(1),
  homeLabel: z.string().min(1),
  themeToLight: z.string().min(1),
  themeToDark: z.string().min(1),
  githubLabel: z.string().min(1),
  printLabel: z.string().min(1),
})
export type FieldGuideUi = z.infer<typeof fieldGuideUiSchema>

/**
 * SEO copy for the guide. `chapterDescriptionTemplate` supports `{title}`
 * (chapter title) and `{guide}` (guide title) placeholders.
 */
export const fieldGuideSeoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  chapterDescriptionTemplate: z.string().min(1),
})
export type FieldGuideSeo = z.infer<typeof fieldGuideSeoSchema>

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
  ui: fieldGuideUiSchema,
  seo: fieldGuideSeoSchema,
  sections: z.array(fieldGuideSectionSchema).min(1),
})
export type FieldGuideManifest = z.infer<typeof fieldGuideManifestSchema>
