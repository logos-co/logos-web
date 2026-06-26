import { assertActiveLocale } from '../locales/registry'
import {
  type FieldGuideItem,
  type FieldGuideManifest,
  type Language,
  fieldGuideManifestSchema,
} from '../schemas/index'

import { ContentNotFoundError, contentPath, readJson, readText } from './_fs'

const FIELD_GUIDE_DIR = 'field-guide'

export const getFieldGuideManifest = async (
  locale: Language
): Promise<FieldGuideManifest> => {
  assertActiveLocale(locale)
  return readJson(
    contentPath(FIELD_GUIDE_DIR, locale, 'manifest.json'),
    fieldGuideManifestSchema
  )
}

/** Flattens the manifest's grouped sections into pager/static-param order. */
export const flattenFieldGuideItems = (
  manifest: FieldGuideManifest
): FieldGuideItem[] => manifest.sections.flatMap((section) => section.items)

/** Slug list for `generateStaticParams`. */
export const getFieldGuideSlugs = async (
  locale: Language
): Promise<string[]> => {
  const manifest = await getFieldGuideManifest(locale)
  return flattenFieldGuideItems(manifest).map((item) => item.slug)
}

/**
 * Reads a chapter's Markdown body. Validates the slug against the manifest so
 * an unknown slug raises `ContentNotFoundError` (route → `notFound()`) rather
 * than leaking a filesystem path or reading outside the chapters directory.
 */
export const getFieldGuideChapter = async (
  locale: Language,
  slug: string
): Promise<string> => {
  assertActiveLocale(locale)
  const slugs = await getFieldGuideSlugs(locale)
  if (!slugs.includes(slug)) {
    throw new ContentNotFoundError(
      contentPath(FIELD_GUIDE_DIR, locale, 'chapters', `${slug}.md`)
    )
  }
  return readText(
    contentPath(FIELD_GUIDE_DIR, locale, 'chapters', `${slug}.md`)
  )
}
