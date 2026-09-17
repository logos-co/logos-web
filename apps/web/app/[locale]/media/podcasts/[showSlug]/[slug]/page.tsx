import { getTranslations } from 'next-intl/server'

import { isActiveLocale } from '@repo/content/locales'

import { JsonLd } from '@/components/seo/json-ld'
import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogPodcastDetail, getBlogPodcastPaths } from '@/lib/blog-content'
import { withLocalMediaImages } from '@/lib/media-image-manifest'
import { absoluteUrl, createDefaultMetadata } from '@/lib/metadata'
import {
  createBreadcrumbListJsonLd,
  createPodcastEpisodeJsonLd,
} from '@/lib/structured-data'

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

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ locale: string; showSlug: string; slug: string }>
}) {
  const { locale, showSlug, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`PodcastPage received non-active locale "${locale}"`)
  }

  // No catch: the slug came from generateStaticParams, so a failure here means
  // the CMS is down or the content is malformed, and the export should stop
  // rather than publish a 404 in place of a real page.
  const [podcast, t] = await Promise.all([
    getBlogPodcastDetail(showSlug, slug),
    getTranslations('mediaDetail'),
  ])

  const copy: PodcastDetailCopy = {
    breadcrumb: t('breadcrumbs.label'),
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
  const podcastPath = ROUTES.mediaPodcast(podcast.showSlug, podcast.slug)
  const canonicalUrl = absoluteUrl(podcastPath, locale)
  const parentCrumbs = [
    { name: t('breadcrumbs.media'), path: ROUTES.media },
    { name: t('breadcrumbs.podcasts'), path: ROUTES.mediaPodcastsSection },
  ]

  return (
    <>
      <JsonLd
        data={createPodcastEpisodeJsonLd({
          path: podcastPath,
          name: podcast.title,
          description: podcast.description,
          image: podcast.ogImage?.url ?? podcast.coverImage?.url,
          datePublished: podcast.publishedAt,
          episodeNumber: podcast.episodeNumber,
          series: podcast.show
            ? { name: podcast.show.title, path: ROUTES.mediaPodcastsSection }
            : null,
        })}
      />
      <JsonLd
        data={createBreadcrumbListJsonLd(
          [...parentCrumbs, { name: podcast.title, path: podcastPath }],
          locale
        )}
      />
      <PodcastDetailPage
        breadcrumbs={parentCrumbs}
        canonicalUrl={canonicalUrl}
        copy={copy}
        podcast={withLocalMediaImages(podcast)}
      />
    </>
  )
}
