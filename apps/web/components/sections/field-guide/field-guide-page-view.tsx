import type { FieldGuideManifest } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'

import { FieldGuideContent } from './field-guide-content'
import { FieldGuideShell } from './field-guide-shell'

const slugToHref = (slug: string): string =>
  slug === 'index' ? ROUTES.fieldGuide : ROUTES.fieldGuideChapter(slug)

interface FieldGuidePageViewProps {
  manifest: FieldGuideManifest
  slug: string
  body: string
}

/**
 * Server view shared by the `/field-guide` index route and the
 * `/field-guide/[slug]` chapter route. Resolves the current chapter's
 * page-reference and prev/next links from the manifest order, then renders the
 * client reading shell around the Markdown content.
 */
export function FieldGuidePageView({
  manifest,
  slug,
  body,
}: FieldGuidePageViewProps) {
  const flat = manifest.sections.flatMap((section) => section.items)
  const index = flat.findIndex((item) => item.slug === slug)
  const current = flat[index]
  if (!current) {
    throw new Error(`field guide chapter "${slug}" missing from manifest`)
  }

  const prevItem = index > 0 ? flat[index - 1] : null
  const nextItem = index < flat.length - 1 ? flat[index + 1] : null

  return (
    <FieldGuideShell
      sections={manifest.sections}
      currentSlug={slug}
      pageRef={{ num: current.num, title: current.title }}
      prev={
        prevItem
          ? { href: slugToHref(prevItem.slug), title: prevItem.title }
          : null
      }
      next={
        nextItem
          ? { href: slugToHref(nextItem.slug), title: nextItem.title }
          : null
      }
    >
      <FieldGuideContent body={body} />
    </FieldGuideShell>
  )
}
