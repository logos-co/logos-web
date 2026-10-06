import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { PodcastCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getLatestBlogPodcasts } from '@/lib/blog-engine'

import { MediaListingIntro } from '@/components/sections/media/media-listing-intro'

import { PodcastsSection } from '../_sections/podcasts'

const ROUTE = ROUTES.mediaPodcasts

const findSection = createSectionFinder('podcast')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function LogosPodcastPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`LogosPodcastPage received non-active locale "${locale}"`)
  }

  const [page, podcasts] = await Promise.all([
    getPageCopy(ROUTE, locale),
    getLatestBlogPodcasts(20),
  ])

  if (podcasts.length === 0) {
    throw new Error('Podcast page requires at least one podcast from blog API')
  }

  const data = findSection<PodcastCopySection>(
    page.sections,
    'podcastCopy',
    'podcast.copy'
  )

  return (
    <div className="overflow-hidden bg-accent-tan pb-10">
      <MediaListingIntro
        copy={{
          title: data.heading,
          description: data.intro.description,
          byline: data.intro.hostedBy,
          backToMedia: data.backToMedia,
        }}
      />
      <PodcastsSection
        podcasts={podcasts}
        ctaHref={ROUTES.mediaPodcastsSection}
        copy={{
          heading: data.latestHeading,
          media: data.eyebrow,
          heroTitle: podcasts[0].title,
          heroDescription: podcasts[0].description,
          latestEpisode: data.latestEpisode,
          seeAllEpisodes: data.seeAllEpisodes,
          listenOnApp: data.listenOnApp,
          cta: data.podcastCta,
          episodePrefix: data.episodePrefix,
          fallbackEpisode: data.fallbackEpisode,
        }}
      />
    </div>
  )
}
