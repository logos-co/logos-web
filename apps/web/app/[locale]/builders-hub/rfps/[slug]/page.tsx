import { notFound } from 'next/navigation'

import { getActiveLocales } from '@repo/content/locales'
import {
  ContentNotFoundError,
  getAllIdeas,
  getAllRfps,
  getRfpBySlug,
} from '@repo/content/loaders'

import { BuildersHubDetailLayout } from '@/components/sections/builders-hub/builders-hub-detail-layout'
import { RelatedLinksList } from '@/components/sections/builders-hub/related-links-list'
import { ROUTES } from '@/constants/routes'
import { formatDateLong } from '@/lib/dates'
import { createDefaultMetadata } from '@/lib/metadata'
import { resolveLocale, type LocaleSlugParams } from '@/lib/route-params'
import { formatReward } from '@/lib/reward'

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = []
  for (const locale of getActiveLocales()) {
    const rfps = await getAllRfps({ locale, status: 'published' })
    for (const rfp of rfps) params.push({ locale, slug: rfp.slug })
  }
  return params
}

export async function generateMetadata({ params }: LocaleSlugParams) {
  const locale = await resolveLocale(params, 'generateMetadata')
  const { slug } = await params
  try {
    const rfp = await getRfpBySlug(slug, locale)
    return createDefaultMetadata({
      title: rfp.title,
      description: rfp.tagline ?? rfp.summary,
      locale,
      path: `${ROUTES.rfps}/${slug}`,
    })
  } catch (error) {
    if (!(error instanceof ContentNotFoundError)) throw error
    return createDefaultMetadata({
      title: 'RFP not found',
      description: 'This RFP does not exist or has not been published yet.',
      locale,
      path: `${ROUTES.rfps}/${slug}`,
    })
  }
}

export default async function RfpDetailPage({ params }: LocaleSlugParams) {
  const locale = await resolveLocale(params, 'RfpDetailPage')
  const { slug } = await params

  let rfp
  try {
    rfp = await getRfpBySlug(slug, locale)
  } catch (error) {
    if (error instanceof ContentNotFoundError) notFound()
    throw error
  }
  if (rfp.status !== 'published') notFound()

  const reward = formatReward(rfp.reward)
  const meta = [
    { label: 'Status', value: rfp.status },
    reward ? { label: 'Reward', value: reward } : null,
    rfp.publishedAt
      ? { label: 'Published', value: formatDateLong(rfp.publishedAt) }
      : null,
    rfp.closesAt
      ? { label: 'Closes', value: formatDateLong(rfp.closesAt) }
      : null,
    rfp.owner
      ? {
          label: 'Owner',
          value: rfp.owner.handle
            ? `${rfp.owner.name} (@${rfp.owner.handle})`
            : rfp.owner.name,
        }
      : null,
    rfp.tags.length > 0 ? { label: 'Tags', value: rfp.tags.join(', ') } : null,
  ].filter((x): x is { label: string; value: string } => Boolean(x))

  // Related ideas footer — if the RFP declares related-ideas, show titles + links.
  let related: { slug: string; title: string }[] = []
  if (rfp.relatedIdeas && rfp.relatedIdeas.length > 0) {
    const allIdeas = await getAllIdeas({ locale, status: 'published' })
    const bySlug = new Map(allIdeas.map((idea) => [idea.slug, idea]))
    related = rfp.relatedIdeas
      .map((s) => bySlug.get(s))
      .filter((idea): idea is NonNullable<typeof idea> => Boolean(idea))
      .map((idea) => ({ slug: idea.slug, title: idea.title }))
  }

  return (
    <BuildersHubDetailLayout
      backHref={ROUTES.rfps}
      backLabel="All RFPs"
      eyebrow={`RFP · ${rfp.status}`}
      title={rfp.title}
      tagline={rfp.tagline}
      description={rfp.description}
      primaryCta={{
        label: rfp.ctaLabel ?? 'Apply',
        href: rfp.applyUrl,
        external: /^https?:\/\//.test(rfp.applyUrl),
      }}
      meta={meta}
      footer={
        <RelatedLinksList
          heading="Related ideas"
          hrefBase={ROUTES.ideas}
          items={related}
        />
      }
    />
  )
}
