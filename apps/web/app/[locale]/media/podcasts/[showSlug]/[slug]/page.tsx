import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogPodcastDetail, getBlogPodcastPaths } from '@/lib/blog-content'
import { absoluteUrl, createDefaultMetadata } from '@/lib/metadata'

import { PodcastDetailPage } from './_sections/podcast-detail-page'
import type { PodcastDetailCopy } from './_sections/types'

export const dynamicParams = false

export async function generateStaticParams() {
  const paths = await getBlogPodcastPaths()
  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({
      locale,
      showSlug: path.showSlug,
      slug: path.slug,
    }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; showSlug: string; slug: string }>
}) {
  const { locale, showSlug, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }

  const podcast = await getBlogPodcastDetail(showSlug, slug)
  return createDefaultMetadata({
    title: `${podcast.title} | Logos`,
    description: podcast.description,
    locale,
    path: ROUTES.mediaPodcast(podcast.showSlug, podcast.slug),
    noindex: podcast.isDraft,
  })
}

function podcastJsonLd(
  podcast: Awaited<ReturnType<typeof getBlogPodcastDetail>>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: podcast.title,
    description: podcast.description,
    datePublished: podcast.publishedAt,
    image: podcast.ogImage?.url ?? podcast.coverImage?.url,
    episodeNumber: podcast.episodeNumber,
    partOfSeries: podcast.show
      ? {
          '@type': 'PodcastSeries',
          name: podcast.show.title,
          url: absoluteUrl(ROUTES.mediaPodcast(podcast.showSlug, podcast.slug)),
        }
      : undefined,
    url: absoluteUrl(ROUTES.mediaPodcast(podcast.showSlug, podcast.slug)),
  }
}

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ locale: string; showSlug: string; slug: string }>
}) {
  const { locale, showSlug, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`PodcastPage received non-active locale "${locale}"`)
  }

  const [podcast, t] = await Promise.all([
    getBlogPodcastDetail(showSlug, slug).catch(() => null),
    getTranslations('mediaDetail.podcast'),
  ])

  if (!podcast) notFound()

  const copy: PodcastDetailCopy = {
    channels: t('channels'),
    close: t('close'),
    copied: t('copied'),
    credits: t('credits'),
    listen: t('listen'),
    minutes: t('minutes'),
    mute: t('mute'),
    pause: t('pause'),
    play: t('play'),
    relatedEpisodes: t('relatedEpisodes'),
    references: t('references'),
    seek: t('seek'),
    share: t('share'),
    showLess: t('showLess'),
    showMore: t('showMore'),
    showNotes: t('showNotes'),
    unmute: t('unmute'),
  }
  const canonicalUrl = absoluteUrl(
    ROUTES.mediaPodcast(podcast.showSlug, podcast.slug),
    locale
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(podcastJsonLd(podcast)),
        }}
      />
      <PodcastDetailPage
        canonicalUrl={canonicalUrl}
        copy={copy}
        podcast={podcast}
      />
    </>
  )
}
