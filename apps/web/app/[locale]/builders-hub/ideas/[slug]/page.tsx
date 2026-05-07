import { notFound } from 'next/navigation'

import { getActiveLocales } from '@repo/content/locales'
import {
  ContentNotFoundError,
  getAllIdeas,
  getAllRfps,
  getIdeaBySlug,
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
    const ideas = await getAllIdeas({ locale, status: 'published' })
    for (const idea of ideas) params.push({ locale, slug: idea.slug })
  }
  return params
}

export async function generateMetadata({ params }: LocaleSlugParams) {
  const locale = await resolveLocale(params, 'generateMetadata')
  const { slug } = await params
  try {
    const idea = await getIdeaBySlug(slug, locale)
    return createDefaultMetadata({
      title: idea.title,
      description: idea.tagline ?? idea.summary,
      locale,
      path: `${ROUTES.ideas}/${slug}`,
    })
  } catch (error) {
    if (!(error instanceof ContentNotFoundError)) throw error
    return createDefaultMetadata({
      title: 'Idea not found',
      description: 'This idea does not exist or has not been published yet.',
      locale,
      path: `${ROUTES.ideas}/${slug}`,
    })
  }
}

export default async function IdeaDetailPage({ params }: LocaleSlugParams) {
  const locale = await resolveLocale(params, 'IdeaDetailPage')
  const { slug } = await params

  let idea
  try {
    idea = await getIdeaBySlug(slug, locale)
  } catch (error) {
    if (error instanceof ContentNotFoundError) notFound()
    throw error
  }
  if (idea.status !== 'published') notFound()

  const submitter = idea.submitter.name
    ? `${idea.submitter.name} (@${idea.submitter.handle})`
    : `@${idea.submitter.handle}`

  const reward = formatReward(idea.reward)

  const meta = [
    { label: 'Status', value: idea.status },
    { label: 'Submitter', value: submitter },
    reward ? { label: 'Reward', value: reward } : null,
    idea.submittedAt
      ? { label: 'Submitted', value: formatDateLong(idea.submittedAt) }
      : null,
    idea.tags.length > 0
      ? { label: 'Tags', value: idea.tags.join(', ') }
      : null,
  ].filter((x): x is { label: string; value: string } => Boolean(x))

  // Related RFPs footer — computed as the reverse of RFP `relatedIdeas`.
  let related: { slug: string; title: string }[] = []
  if (idea.relatedRfpSlugs.length > 0) {
    const allRfps = await getAllRfps({ locale, status: 'published' })
    const bySlug = new Map(allRfps.map((rfp) => [rfp.slug, rfp]))
    related = idea.relatedRfpSlugs
      .map((s) => bySlug.get(s))
      .filter((rfp): rfp is NonNullable<typeof rfp> => Boolean(rfp))
      .map((rfp) => ({ slug: rfp.slug, title: rfp.title }))
  }

  return (
    <BuildersHubDetailLayout
      backHref={ROUTES.ideas}
      backLabel="All ideas"
      eyebrow={`Idea · ${idea.status}`}
      title={idea.title}
      tagline={idea.tagline}
      description={idea.description}
      primaryCta={
        idea.discussionUrl
          ? {
              label: idea.ctaLabel ?? 'Discuss',
              href: idea.discussionUrl,
              external: true,
            }
          : undefined
      }
      meta={meta}
      footer={
        <RelatedLinksList
          heading="Related RFPs"
          hrefBase={ROUTES.rfps}
          items={related}
        />
      }
    />
  )
}
