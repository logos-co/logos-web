import { rfpIndexSchema, rfpLocaleSchema } from '@repo/content/schemas'

import {
  createFixturePair,
  stripEmpty,
  toIsoDateOrUndefined,
  type FixturePair,
} from './fixture-helpers'
import {
  createContentUpdatePrBody,
  createContentUpdateSubject,
  saveAsPullRequest,
  type SaveAsPullRequestResult,
  type SaveContentAsPullRequestInput,
} from './save-as-pr'

/**
 * Shape of an Rfp doc as Payload returns it from `payload.findByID`. Mirrors
 * the collection's field config — see `apps/cms/src/collections/Rfps.ts`.
 *
 * Hand-typed (rather than imported from `@repo/types`) because the generated
 * Payload types are emitted from a build step that may lag the collection
 * during development.
 */
export type RfpDocLike = {
  slug: string
  status: 'draft' | 'review' | 'published' | 'archived'
  title: string
  tagline?: string | null
  summary: string
  description: string
  ctaLabel?: string | null
  rewardAmount: number
  rewardCurrency: 'USDC'
  rewardXp?: number | null
  applyUrl: string
  tags?: string[] | null
  featured?: boolean | null
  order?: number | null
  publishedAt?: string | null
  closesAt?: string | null
  ownerName?: string | null
  ownerHandle?: string | null
  relatedIdeas?: string[] | null
}

/**
 * Maps a Payload Rfp document to the locale-agnostic `index.json` shape and
 * the per-locale `<lang>.json` shape used by `@repo/content` loaders, then
 * Zod-validates each before they touch GitHub. Validation failure throws
 * here rather than at PR-open time, so the editor sees a precise error
 * before any branch is created.
 */
export const buildRfpFixtureChanges = (doc: RfpDocLike): FixturePair => {
  const targetDir = `content/builders-hub/rfps/${doc.slug}`

  const indexCandidate = stripEmpty({
    schemaVersion: 1,
    slug: doc.slug,
    status: doc.status,
    reward: stripEmpty({
      amount: doc.rewardAmount,
      currency: doc.rewardCurrency,
      xp: doc.rewardXp ?? undefined,
    }),
    applyUrl: doc.applyUrl,
    tags: doc.tags ?? [],
    featured: doc.featured ?? false,
    order: doc.order ?? undefined,
    publishedAt: toIsoDateOrUndefined(doc.publishedAt),
    closesAt: toIsoDateOrUndefined(doc.closesAt),
    owner:
      doc.ownerName || doc.ownerHandle
        ? stripEmpty({
            name: doc.ownerName ?? undefined,
            handle: doc.ownerHandle ?? undefined,
          })
        : undefined,
    relatedIdeas: doc.relatedIdeas ?? undefined,
  })

  const localeCandidate = stripEmpty({
    language: 'en',
    title: doc.title,
    tagline: doc.tagline ?? undefined,
    summary: doc.summary,
    description: doc.description,
    ctaLabel: doc.ctaLabel ?? undefined,
  })

  // Zod-validate before serialising — surface field-level errors to the editor.
  const indexParsed = rfpIndexSchema.parse(indexCandidate)
  const localeParsed = rfpLocaleSchema.parse(localeCandidate)

  return createFixturePair({
    targetDir,
    locale: 'en',
    indexValue: indexParsed,
    localeValue: localeParsed,
  })
}

/**
 * High-level entry point invoked by the Admin "Create PR" action. Takes the
 * Payload doc + the request's Payload instance and editor metadata, builds
 * the file-change pair, and delegates to `saveAsPullRequest`.
 */
export const saveRfpAsPullRequest = async ({
  doc,
  payload,
  editor,
}: SaveContentAsPullRequestInput<RfpDocLike>): Promise<SaveAsPullRequestResult> => {
  const { indexChange, localeChange } = buildRfpFixtureChanges(doc)
  const subject = createContentUpdateSubject({
    scope: 'rfp',
    slug: doc.slug,
  })

  return saveAsPullRequest({
    contentType: 'rfp',
    identifier: doc.slug,
    changes: [indexChange, localeChange],
    commitMessage: subject,
    prTitle: subject,
    prBody: createContentUpdatePrBody({
      displayName: doc.title,
      contentLabel: 'RFP',
      details: [
        `- slug: \`${doc.slug}\``,
        `- status: \`${doc.status}\``,
        `- reward: ${doc.rewardAmount} ${doc.rewardCurrency}${doc.rewardXp ? ` + ${doc.rewardXp} XP` : ''}`,
      ],
    }),
    draft: true,
    editor,
    payload,
  })
}
