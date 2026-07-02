import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { PodcastCopySection } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import ContentWidth from '@/components/layout/content-width'
import { ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'
import { BLOG_ORIGIN, getLatestBlogPodcasts } from '@/lib/blog-engine'

import { PodcastsSection } from '../media/_sections/podcasts'

interface PodcastIntroCopy {
  title: string
  description: string
  hostedBy: string
  backToMedia: string
}

function PodcastIntro({ copy }: { copy: PodcastIntroCopy }) {
  return (
    <section className="bg-accent-tan pb-12 pt-8 text-brand-dark-green md:pb-16">
      <ContentWidth className="flex w-full flex-col gap-10 md:gap-11.5">
        <Link
          href={ROUTES.media}
          className="inline-flex w-fit cursor-pointer items-center gap-1 text-brand-dark-green transition-opacity hover:opacity-70"
        >
          <span className="inline-flex size-3.75 shrink-0 rotate-180 items-center justify-center">
            <ButtonArrowIcon />
          </span>
          <span className="font-mono text-[10px] leading-[1.3] font-medium uppercase">
            {copy.backToMedia}
          </span>
        </Link>
        <div className="grid w-full items-start gap-6 md:grid-cols-12">
          <div className="flex items-center gap-3 md:col-span-5">
            <LogosMark size={20} className="shrink-0" />
            <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] md:text-[36px]">
              {copy.title}
            </h1>
          </div>
          <div className="text-mono-s flex min-w-0 flex-col gap-6 text-black md:col-start-7 md:col-end-10">
            <p className="wrap-break-word">{copy.description}</p>
            <p>{copy.hostedBy}</p>
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}

const ROUTE = ROUTES.podcast

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
    'podcast.copy',
  )

  return (
    <div className="overflow-hidden bg-accent-tan pb-10">
      <PodcastIntro
        copy={{
          title: data.heading,
          description: data.intro.description,
          hostedBy: data.intro.hostedBy,
          backToMedia: data.backToMedia,
        }}
      />
      <PodcastsSection
        podcasts={podcasts}
        ctaHref={`${BLOG_ORIGIN}/podcasts`}
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
