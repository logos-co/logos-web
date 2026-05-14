/**
 * Imports content fixtures from `content/**` into the Payload database so
 * editors can find and modify them in Admin.
 *
 * The CMS is the editor's source of truth at edit time; the Git repo is
 * source of truth at runtime. This script bridges the two on demand: run it
 * after a fresh DB boot or after a content PR merges, so the Admin view
 * reflects the latest committed state.
 *
 * Plan §Phase 3 envisions an automatic `beforeRead` hook to do the same
 * job inside Payload itself — this script is the manual interim until that
 * lands.
 *
 * Usage:
 *   cd apps/cms && set -a && source .env && set +a && \
 *     pnpm sync-from-content
 *
 * Skipped (out of scope for this script):
 *   - pages: collection is a stub (no fields defined)
 *   - press / site settings: globals, not per-row collections
 */
import { getPayload } from 'payload'

import {
  getAllIdeas,
  getAllRfps,
  getBuilderHubListingSettings,
  getBuilderHubSettings,
  getBuilderResources,
  getCircleEvents,
  getCircleInitiatives,
  getCircleResources,
  getCircles,
  type Circle,
  type CircleEvent,
  type CircleInitiative,
  type CircleResource,
  type BuilderResource,
  type Idea,
  type Rfp,
} from '@repo/content/loaders'
import type {
  BuilderHubListingPageSettings,
  BuilderHubSettings,
} from '@repo/content/schemas'

import config from '@payload-config'
import { SKIP_CONTENT_PR_CONTEXT } from '../src/collections/content-pr-hooks'

type SyncResult = { created: number; updated: number; skipped: number }

const flattenImage = (image?: {
  src?: string
  alt?: string
  width?: number
  height?: number
}): {
  imageSrc: string | null
  imageAlt: string | null
  imageWidth: number | null
  imageHeight: number | null
} => {
  if (!image) {
    return {
      imageSrc: null,
      imageAlt: null,
      imageWidth: null,
      imageHeight: null,
    }
  }
  return {
    imageSrc: image.src ?? null,
    imageAlt: image.alt ?? '',
    imageWidth: image.width ?? null,
    imageHeight: image.height ?? null,
  }
}

const mapCircle = (c: Circle): Record<string, unknown> & { slug: string } => ({
  slug: c.slug,
  status: c.status,
  name: c.name,
  description: c.description,
  city: c.city,
  country: c.country,
  region: c.region ?? null,
  lat: c.coordinates.lat,
  lng: c.coordinates.lng,
  timezone: c.timezone,
  memberCount: c.memberCount ?? null,
  discordChannel: c.discordChannel ?? null,
  discordUrl: c.discordUrl ?? null,
  forumUrl: c.forumUrl ?? null,
  joinUrl: c.joinUrl,
  ...flattenImage(c.image),
  // Payload array fields reject `null` (would trigger a `$push` on null);
  // use `[]` for absent arrays.
  organizers:
    c.organizers && c.organizers.length > 0
      ? c.organizers.map((o) => ({ name: o.name, handle: o.handle ?? null }))
      : [],
  order: c.order ?? null,
})

const mapCircleEvent = (
  e: CircleEvent
): Record<string, unknown> & { slug: string } => ({
  slug: e.slug,
  status: e.status,
  circleSlug: e.circleSlug,
  title: e.title,
  locationLabel: e.locationLabel,
  startsAt: e.startsAt,
  endsAt: e.endsAt ?? null,
  timezone: e.timezone,
  venueName: e.venueName ?? null,
  address: e.address ?? null,
  eventUrl: e.eventUrl ?? null,
  ...flattenImage(e.image),
  hostedBy:
    e.hostedBy && e.hostedBy.length > 0
      ? e.hostedBy.map((h) => ({ name: h.name }))
      : [],
  featured: e.featured,
  // The loader fills sequenceNumber when absent in file; we round-trip the
  // computed value so Admin reflects what runtime sees.
  sequenceNumber: e.sequenceNumber ?? null,
})

const mapCircleInitiative = (
  i: CircleInitiative
): Record<string, unknown> & { slug: string } => ({
  slug: i.slug,
  status: i.status,
  circleSlug: i.circleSlug,
  href: i.href,
  title: i.title,
  locationLabel: i.locationLabel,
  description: i.description,
  ctaLabel: i.ctaLabel,
  ...flattenImage(i.image),
  featured: i.featured,
  order: i.order ?? null,
})

const mapCircleResource = (
  r: CircleResource
): Record<string, unknown> & { slug: string } => ({
  slug: r.slug,
  status: r.status,
  title: r.title,
  description: r.description,
  ctaLabel: r.ctaLabel,
  href: r.href,
})

const mapBuilderResource = (
  r: BuilderResource
): Record<string, unknown> & { slug: string } => ({
  slug: r.slug,
  status: r.status,
  title: r.title,
  description: r.description,
  ctaLabel: r.ctaLabel,
  href: r.href,
})

const mapBuilderListingSettings = (
  settings: BuilderHubListingPageSettings
): Record<string, unknown> & { page: 'ideas' | 'rfps' } => ({
  page: settings.page,
  title: settings.title,
  description: settings.description,
  breadcrumbLabel: settings.breadcrumbLabel,
  submitCtaLabel: settings.submitCta.label,
  submitCtaHref: settings.submitCta.href,
  submitCtaExternal: settings.submitCta.external ?? false,
  defaultView: settings.defaultView,
  pageSize: settings.pageSize,
  previousLabel: settings.pagination.previousLabel,
  nextLabel: settings.pagination.nextLabel,
  bottomCtaTitle: settings.bottomCta.title,
  bottomCtaLabel: settings.bottomCta.cta.label,
  bottomCtaHref: settings.bottomCta.cta.href,
  bottomCtaExternal: settings.bottomCta.cta.external ?? false,
})

const mapBuilderHubSettings = (
  settings: BuilderHubSettings
): Record<string, unknown> & { slug: string } => ({
  slug: 'builders-hub',
  settings,
})

const mapRfp = (r: Rfp): Record<string, unknown> & { slug: string } => ({
  slug: r.slug,
  status: r.status,
  title: r.title,
  tagline: r.tagline ?? null,
  summary: r.summary,
  description: r.description,
  ctaLabel: r.ctaLabel ?? null,
  rewardAmount: r.reward.amount,
  rewardCurrency: r.reward.currency,
  rewardXp: r.reward.xp ?? null,
  applyUrl: r.applyUrl,
  tags: r.tags ?? [],
  featured: r.featured,
  order: r.order ?? null,
  publishedAt: r.publishedAt ?? null,
  closesAt: r.closesAt ?? null,
  ownerName: r.owner?.name ?? null,
  ownerHandle: r.owner?.handle ?? null,
  relatedIdeas: r.relatedIdeas ?? null,
})

const mapIdea = (i: Idea): Record<string, unknown> & { slug: string } => ({
  slug: i.slug,
  status: i.status,
  title: i.title,
  tagline: i.tagline ?? null,
  summary: i.summary,
  description: i.description,
  ctaLabel: i.ctaLabel ?? null,
  submitterName: i.submitter.name ?? null,
  submitterHandle: i.submitter.handle,
  rewardAmount: i.reward?.amount ?? null,
  rewardCurrency: i.reward?.currency ?? null,
  rewardXp: i.reward?.xp ?? null,
  discussionUrl: i.discussionUrl ?? null,
  tags: i.tags ?? [],
  featured: i.featured,
  order: i.order ?? null,
  submittedAt: i.submittedAt ?? null,
})

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

const upsertBySlug = async (
  payload: PayloadInstance,
  collection: string,
  data: Record<string, unknown> & { slug: string }
): Promise<'created' | 'updated'> => {
  return upsertByField(payload, collection, 'slug', data.slug, data)
}

const upsertByField = async (
  payload: PayloadInstance,
  collection: string,
  field: string,
  value: string,
  data: Record<string, unknown>
): Promise<'created' | 'updated'> => {
  const found = await payload.find({
    collection: collection as Parameters<
      PayloadInstance['find']
    >[0]['collection'],
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
  })
  if (found.docs.length > 0) {
    await payload.update({
      collection: collection as Parameters<
        PayloadInstance['update']
      >[0]['collection'],
      id: found.docs[0]!.id,
      data: data as never,
      context: { [SKIP_CONTENT_PR_CONTEXT]: true },
    })
    return 'updated'
  }
  await payload.create({
    collection: collection as Parameters<
      PayloadInstance['create']
    >[0]['collection'],
    data: data as never,
    context: { [SKIP_CONTENT_PR_CONTEXT]: true },
  })
  return 'created'
}

const syncSingleton = async <TData extends Record<string, unknown>>(
  payload: PayloadInstance,
  collectionSlug: string,
  field: string,
  value: string,
  data: TData
): Promise<SyncResult> => {
  try {
    const op = await upsertByField(payload, collectionSlug, field, value, data)
    return {
      created: op === 'created' ? 1 : 0,
      updated: op === 'updated' ? 1 : 0,
      skipped: 0,
    }
  } catch (err) {
    console.error(
      `  ✗ ${collectionSlug}/${value}: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
    return { created: 0, updated: 0, skipped: 1 }
  }
}

const syncCollection = async <T extends { slug: string }>(
  payload: PayloadInstance,
  collectionSlug: string,
  list: () => Promise<T[]>,
  map: (item: T) => Record<string, unknown> & { slug: string }
): Promise<SyncResult> => {
  const items = await list()
  const result: SyncResult = { created: 0, updated: 0, skipped: 0 }
  for (const item of items) {
    try {
      const op = await upsertBySlug(payload, collectionSlug, map(item))
      result[op]++
    } catch (err) {
      console.error(
        `  ✗ ${collectionSlug}/${item.slug}: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
      result.skipped++
    }
  }
  return result
}

const main = async (): Promise<void> => {
  const payload = await getPayload({ config })

  const targets = [
    {
      name: 'circles',
      run: () =>
        syncCollection(
          payload,
          'circles',
          () => getCircles({ locale: 'en' }),
          mapCircle
        ),
    },
    {
      name: 'circle-events',
      run: () =>
        syncCollection(
          payload,
          'circle-events',
          () => getCircleEvents({ locale: 'en' }),
          mapCircleEvent
        ),
    },
    {
      name: 'circle-initiatives',
      run: () =>
        syncCollection(
          payload,
          'circle-initiatives',
          () => getCircleInitiatives({ locale: 'en' }),
          mapCircleInitiative
        ),
    },
    {
      name: 'circle-resources',
      run: () =>
        syncCollection(
          payload,
          'circle-resources',
          () => getCircleResources({ locale: 'en' }),
          mapCircleResource
        ),
    },
    {
      name: 'builder-resources',
      run: () =>
        syncCollection(
          payload,
          'builder-resources',
          () => getBuilderResources({ locale: 'en' }),
          mapBuilderResource
        ),
    },
    {
      name: 'builder-listing-rfps',
      run: async () =>
        syncSingleton(
          payload,
          'builder-listing-settings',
          'page',
          'rfps',
          mapBuilderListingSettings(
            await getBuilderHubListingSettings({ page: 'rfps', locale: 'en' })
          )
        ),
    },
    {
      name: 'builder-listing-ideas',
      run: async () =>
        syncSingleton(
          payload,
          'builder-listing-settings',
          'page',
          'ideas',
          mapBuilderListingSettings(
            await getBuilderHubListingSettings({ page: 'ideas', locale: 'en' })
          )
        ),
    },
    {
      name: 'builder-hub-settings',
      run: async () =>
        syncSingleton(
          payload,
          'builder-hub-settings',
          'slug',
          'builders-hub',
          mapBuilderHubSettings(await getBuilderHubSettings('en'))
        ),
    },
    {
      name: 'rfps',
      run: () =>
        syncCollection(
          payload,
          'rfps',
          () => getAllRfps({ locale: 'en' }),
          mapRfp
        ),
    },
    {
      name: 'ideas',
      run: () =>
        syncCollection(
          payload,
          'ideas',
          () => getAllIdeas({ locale: 'en' }),
          mapIdea
        ),
    },
  ]

  for (const target of targets) {
    process.stdout.write(`${target.name.padEnd(20)} `)
    const result = await target.run()
    console.log(
      `created=${result.created}, updated=${result.updated}, skipped=${result.skipped}`
    )
  }

  // Payload keeps DB pool open; force-exit so the script doesn't hang.
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
