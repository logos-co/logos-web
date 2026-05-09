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
 *   - circle-resources: single multi-item file, no per-row mapping
 *   - pages: collection is a stub (no fields defined)
 *   - press / site / builders-hub settings: globals, not per-row collections
 */
import { getPayload } from 'payload'

import {
  getAllIdeas,
  getAllRfps,
  getCircleEvents,
  getCircleInitiatives,
  getCircles,
  type Circle,
  type CircleEvent,
  type CircleInitiative,
  type Idea,
  type Rfp,
} from '@repo/content/loaders'

import config from '@payload-config'

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
  const found = await payload.find({
    collection: collection as Parameters<
      PayloadInstance['find']
    >[0]['collection'],
    where: { slug: { equals: data.slug } },
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
    })
    return 'updated'
  }
  await payload.create({
    collection: collection as Parameters<
      PayloadInstance['create']
    >[0]['collection'],
    data: data as never,
  })
  return 'created'
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
