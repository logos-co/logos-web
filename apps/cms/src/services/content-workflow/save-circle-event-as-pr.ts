import {
  circleEventIndexSchema,
  circleEventLocaleSchema,
} from '@repo/content/schemas'
import type { FileChange } from '@repo/content/github'
import type { Payload } from 'payload'

import { saveAsPullRequest, type SaveAsPullRequestResult } from './save-as-pr'

/**
 * Shape of a CircleEvent doc as Payload returns it from `payload.findByID`.
 * Mirrors the collection field config in `apps/cms/src/collections/Circles.ts`
 * (`CircleEvents` export).
 *
 * Hand-typed (rather than imported from `@repo/types`) because the generated
 * Payload types are emitted from a build step that may lag the collection
 * during development.
 */
export type CircleEventDocLike = {
  slug: string
  status: 'draft' | 'review' | 'published' | 'archived'
  circleSlug: string
  title: string
  locationLabel: string
  startsAt: string
  endsAt?: string | null
  timezone: string
  venueName?: string | null
  address?: string | null
  eventUrl?: string | null
  imageSrc?: string | null
  imageAlt?: string | null
  imageWidth?: number | null
  imageHeight?: number | null
  hostedBy?: Array<{ name: string }> | null
  featured?: boolean | null
  sequenceNumber?: number | null
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

const toIsoDateOrUndefined = (
  raw: string | null | undefined
): string | undefined => {
  if (!raw) return undefined
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

/**
 * Maps a Payload CircleEvent document to the locale-agnostic `index.json`
 * shape and the per-locale `<lang>.json` shape used by `@repo/content`
 * loaders, then Zod-validates each before they touch GitHub. Validation
 * failure throws here rather than at PR-open time.
 */
export const buildCircleEventFixtureChanges = (
  doc: CircleEventDocLike
): { indexChange: FileChange; localeChange: FileChange } => {
  const targetDir = `content/circles/events/${doc.slug}`

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
    startsAt: toIsoDateOrUndefined(doc.startsAt),
    endsAt: toIsoDateOrUndefined(doc.endsAt),
    timezone: doc.timezone,
    venueName: doc.venueName ?? undefined,
    address: doc.address ?? undefined,
    eventUrl: doc.eventUrl ?? undefined,
    image,
    hostedBy: doc.hostedBy ?? [],
    featured: doc.featured ?? false,
    sequenceNumber: doc.sequenceNumber ?? undefined,
  })

  const localeCandidate = stripEmpty({
    language: 'en',
    title: doc.title,
    locationLabel: doc.locationLabel,
  })

  const indexParsed = circleEventIndexSchema.parse(indexCandidate)
  const localeParsed = circleEventLocaleSchema.parse(localeCandidate)

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

export const saveCircleEventAsPullRequest = async ({
  doc,
  payload,
  editor,
}: {
  doc: CircleEventDocLike
  payload: Payload
  editor?: {
    email?: string
    payloadUserId?: string | number
    payloadAuditUrl?: string
  }
}): Promise<SaveAsPullRequestResult> => {
  const { indexChange, localeChange } = buildCircleEventFixtureChanges(doc)

  return saveAsPullRequest({
    contentType: 'circle-event',
    identifier: doc.slug,
    changes: [indexChange, localeChange],
    commitMessage: `content(circle-event): update ${doc.slug}`,
    prTitle: `content(circle-event): update ${doc.slug}`,
    prBody: [
      `Updates the **${doc.title}** Circle event fixture from the CMS Admin.`,
      '',
      `- slug: \`${doc.slug}\``,
      `- circleSlug: \`${doc.circleSlug}\``,
      `- status: \`${doc.status}\``,
      `- startsAt: ${doc.startsAt}`,
    ].join('\n'),
    draft: true,
    editor,
    payload,
  })
}
