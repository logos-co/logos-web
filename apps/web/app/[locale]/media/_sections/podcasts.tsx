/**
 * Podcast sections used by the `/blog` page: hero card, list rows,
 * and the wrapping section that repeats the list to fill the Figma frame.
 */
import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { ExternalLink } from '@/components/ui'
import { repeatToLength, type BlogPodcastRow } from '@/lib/blog-engine'

import {
  ArrowIcon,
  Dot,
  PlayIcon,
  BlogRowLink,
  RowThumbnail,
  SectionCta,
  UnderlineLabel,
} from './blog-atoms'

interface PodcastsCopy {
  heading: string
  media: string
  heroTitle: string
  heroDescription: string
  latestEpisode: string
  seeAllEpisodes: string
  listenOnApp: string
  cta: string
  episodePrefix: string
  fallbackEpisode: string
}

function PodcastHero({
  latestPodcast,
  copy,
}: {
  latestPodcast: BlogPodcastRow
  copy: Pick<
    PodcastsCopy,
    | 'media'
    | 'heroTitle'
    | 'heroDescription'
    | 'latestEpisode'
    | 'seeAllEpisodes'
  >
}) {
  return (
    <div className="h-[723px] bg-accent-tan p-3 xl:h-[430px]">
      <ExternalLink
        href={latestPodcast.href}
        className="group block cursor-pointer"
      >
        <ContentWidth className="relative h-[699px] overflow-hidden rounded-xl xl:h-[406px]">
          <Image
            src="/images/blog-engine/podcast-hero-bg.webp"
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover object-center blur-[20px]"
          />
          <div className="absolute left-3 top-3 flex h-[268px] w-[calc(100%-24px)] max-w-[345px] min-w-0 flex-col justify-between text-brand-off-white xl:h-[380px] xl:w-[453px] xl:max-w-[453px]">
            <div className="flex items-center gap-25.5">
              <LogosMark size={6} className="shrink-0" />
              <span className="font-mono text-[10px] font-medium uppercase leading-[1.3]">
                {copy.media}
              </span>
            </div>
            <div className="pt-10 xl:pt-0 flex flex-col gap-3">
              <h3 className="w-[185px] font-sans text-[24px] leading-[1.1] tracking-normal xl:w-auto">
                {copy.heroTitle}
              </h3>
              <p className="text-mono-s line-clamp-8 max-w-full text-brand-off-white xl:line-clamp-7 xl:max-w-[453px]">
                {copy.heroDescription}
              </p>
            </div>
            <div className="flex w-[302px] max-w-full min-w-0 items-center gap-2.5">
              <PlayIcon inverted />
              <span className="shrink-0 font-sans text-[14px] font-medium leading-[1.2]">
                {copy.latestEpisode}
              </span>
              <span className="min-w-0 truncate font-display text-[14px] leading-[1.2] text-gray-02">
                {latestPodcast.title}
              </span>
            </div>
          </div>
          <div className="absolute left-3 top-[397px] flex h-[290px] w-[calc(100%-24px)] items-center justify-center rounded-[100px] bg-accent-tan text-brand-dark-green xl:hidden">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase leading-[1.35]">
              {copy.seeAllEpisodes}
              <ArrowIcon />
            </span>
          </div>
          <div className="absolute hidden overflow-hidden rounded xl:bottom-auto xl:left-auto xl:right-3 xl:top-3 xl:block xl:h-[382px] xl:w-[702px] xl:max-w-[calc(100%-24px)]">
            <Image
              src={latestPodcast.image}
              alt=""
              fill
              sizes="702px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </ContentWidth>
      </ExternalLink>
    </div>
  )
}

function PodcastEntry({
  podcast,
  index,
  listenOnAppLabel,
  episodePrefix,
  fallbackEpisode,
}: {
  podcast: BlogPodcastRow
  index: number
  listenOnAppLabel: string
  episodePrefix: string
  fallbackEpisode: string
}) {
  const episodeLabel = podcast.episodeNumber
    ? `${episodePrefix} ${podcast.episodeNumber}`
    : fallbackEpisode

  return (
    <BlogRowLink href={podcast.href} index={index} className="h-[107px]">
      <ContentWidth className="relative flex h-full items-center gap-3 md:grid md:grid-cols-[190px_minmax(0,524px)_minmax(0,573px)] md:gap-0">
        <RowThumbnail
          src={podcast.image}
          className="aspect-video h-auto w-[174px] shrink-0 justify-self-center"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 md:h-full md:gap-1.5 md:py-3 md:pl-3">
          <div className="text-mono-s flex items-center gap-2.5 text-brand-dark-green">
            <span>{podcast.date}</span>
            <Dot />
            <span>{episodeLabel}</span>
          </div>
          <div className="flex w-full items-center gap-2.5 md:max-w-[333px]">
            <PlayIcon />
            <p className="line-clamp-2 font-sans text-[18px] leading-[1.15] tracking-normal">
              {podcast.title}
            </p>
          </div>
        </div>
        <div className="hidden items-start md:flex md:gap-8 xl:gap-33">
          <div className="min-w-0 flex-1 max-w-[345px] py-3" />
          <div className="shrink-0 py-3">
            <UnderlineLabel>{listenOnAppLabel}</UnderlineLabel>
          </div>
        </div>
      </ContentWidth>
    </BlogRowLink>
  )
}

export function PodcastsSection({
  podcasts,
  copy,
  ctaHref,
}: {
  podcasts: BlogPodcastRow[]
  copy: PodcastsCopy
  ctaHref: string
}) {
  const latestPodcast = podcasts[0]
  const listPodcasts = podcasts.slice(1)
  const repeatedPodcasts =
    listPodcasts.length > 0 ? repeatToLength(listPodcasts, 8) : []

  return (
    <section id="podcasts" className="bg-accent-tan pt-20">
      <ContentWidth className="flex h-[22px] items-center pl-3 md:h-[26px]">
        <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em] text-brand-dark-green">
          {copy.heading}
        </h2>
      </ContentWidth>
      <div className="mt-3 bg-accent-tan">
        <PodcastHero latestPodcast={latestPodcast} copy={copy} />
        {repeatedPodcasts.map((podcast, index) => (
          <PodcastEntry
            key={`${podcast.title}-${index}`}
            podcast={podcast}
            index={index}
            listenOnAppLabel={copy.listenOnApp}
            episodePrefix={copy.episodePrefix}
            fallbackEpisode={copy.fallbackEpisode}
          />
        ))}
        <SectionCta href={ctaHref} label={copy.cta} />
      </div>
    </section>
  )
}
