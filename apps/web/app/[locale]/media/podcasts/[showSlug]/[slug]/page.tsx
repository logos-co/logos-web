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
    image: podcast.ogImage ?? podcast.coverImage,
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
          url: absoluteUrl(ROUTES.mediaPodcastsSection),
        }
      : undefined,
    url: absoluteUrl(ROUTES.mediaPodcast(podcast.showSlug, podcast.slug)),
  }
}

function podcastBreadcrumbJsonLd(
  podcast: { showSlug: string; slug: string; title: string },
  labels: { media: string; podcasts: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: labels.media,
        item: absoluteUrl(ROUTES.media),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: labels.podcasts,
        item: absoluteUrl(ROUTES.mediaPodcastsSection),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: podcast.title,
        item: absoluteUrl(ROUTES.mediaPodcast(podcast.showSlug, podcast.slug)),
      },
    ],
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
    getTranslations('mediaDetail'),
  ])

  if (!podcast) notFound()

  const copy: PodcastDetailCopy = {
    channels: t('podcast.channels'),
    close: t('podcast.close'),
    copied: t('podcast.copied'),
    credits: t('podcast.credits'),
    listen: t('podcast.listen'),
    minutes: t('podcast.minutes'),
    mute: t('podcast.mute'),
    pause: t('podcast.pause'),
    play: t('podcast.play'),
    relatedEpisodes: t('podcast.relatedEpisodes'),
    references: t('podcast.references'),
    seek: t('podcast.seek'),
    share: t('podcast.share'),
    showLess: t('podcast.showLess'),
    showMore: t('podcast.showMore'),
    showNotes: t('podcast.showNotes'),
    unmute: t('podcast.unmute'),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            podcastBreadcrumbJsonLd(podcast, {
              media: t('breadcrumbs.media'),
              podcasts: t('breadcrumbs.podcasts'),
            })
          ),
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
