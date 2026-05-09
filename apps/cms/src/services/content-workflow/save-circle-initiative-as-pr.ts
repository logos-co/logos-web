import {
  circleInitiativeIndexSchema,
  circleInitiativeLocaleSchema,
} from '@repo/content/schemas'
import type { FileChange } from '@repo/content/github'
import type { Payload } from 'payload'

import { saveAsPullRequest, type SaveAsPullRequestResult } from './save-as-pr'

/**
 * Shape of a CircleInitiative doc as Payload returns it from
 * `payload.findByID`. Mirrors the collection field config in
 * `apps/cms/src/collections/Circles.ts` (`CircleInitiatives` export).
 *
 * Hand-typed (rather than imported from `@repo/types`) because the generated
 * Payload types are emitted from a build step that may lag the collection
 * during development.
 */
export type CircleInitiativeDocLike = {
  slug: string
  status: 'draft' | 'review' | 'published' | 'archived'
  circleSlug: string
  href: string
  title: string
  locationLabel: string
  description: string
  ctaLabel: string
  imageSrc?: string | null
  imageAlt?: string | null
  imageWidth?: number | null
  imageHeight?: number | null
  featured?: boolean | null
  order?: number | null
}

const stripEmpty = <T extends Record<string, unknown>>(obj: T): T => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out as T
}

/**
 * Maps a Payload CircleInitiative document to the locale-agnostic
 * `index.json` shape and the per-locale `<lang>.json` shape used by
 * `@repo/content` loaders, then Zod-validates each.
 *
 * `image` is required by `circleInitiativeIndexSchema` (not optional),
 * so the editor must provide at least an `imageSrc` before this can succeed.
 * The validation error surfaces inline in the Admin button on save.
 */
export const buildCircleInitiativeFixtureChanges = (
  doc: CircleInitiativeDocLike
): { indexChange: FileChange; localeChange: FileChange } => {
  const targetDir = `content/circles/initiatives/${doc.slug}`

  const image = doc.imageSrc
    ? stripEmpty({
        src: doc.imageSrc,
        alt: doc.imageAlt ?? '',
        width: doc.imageWidth ?? undefined,
        height: doc.imageHeight ?? undefined,
      })
    : undefined

  const indexCandidate = stripEmpty({
    schemaVersion: 1,
    slug: doc.slug,
    status: doc.status,
    circleSlug: doc.circleSlug,
    href: doc.href,
    image,
    featured: doc.featured ?? false,
    order: doc.order ?? undefined,
  })

  const localeCandidate = stripEmpty({
    language: 'en',
    locationLabel: doc.locationLabel,
    title: doc.title,
    description: doc.description,
    ctaLabel: doc.ctaLabel,
  })

  const indexParsed = circleInitiativeIndexSchema.parse(indexCandidate)
  const localeParsed = circleInitiativeLocaleSchema.parse(localeCandidate)

  return {
    indexChange: {
      path: `${targetDir}/index.json`,
      content: JSON.stringify(indexParsed, null, 2) + '\n',
    },
    localeChange: {
      path: `${targetDir}/en.json`,
      content: JSON.stringify(localeParsed, null, 2) + '\n',
    },
  }
}

export const saveCircleInitiativeAsPullRequest = async ({
  doc,
  payload,
  editor,
}: {
  doc: CircleInitiativeDocLike
  payload: Payload
  editor?: {
    email?: string
    payloadUserId?: string | number
    payloadAuditUrl?: string
  }
}): Promise<SaveAsPullRequestResult> => {
  const { indexChange, localeChange } = buildCircleInitiativeFixtureChanges(doc)

  return saveAsPullRequest({
    contentType: 'circle-initiative',
    identifier: doc.slug,
    changes: [indexChange, localeChange],
    commitMessage: `content(circle-initiative): update ${doc.slug}`,
    prTitle: `content(circle-initiative): update ${doc.slug}`,
    prBody: [
      `Updates the **${doc.title}** Circle initiative fixture from the CMS Admin.`,
      '',
      `- slug: \`${doc.slug}\``,
      `- circleSlug: \`${doc.circleSlug}\``,
      `- status: \`${doc.status}\``,
    ].join('\n'),
    draft: true,
    editor,
    payload,
  })
}
