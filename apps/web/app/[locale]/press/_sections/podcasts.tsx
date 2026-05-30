/**
 * Podcast sections used by the `/press` page: hero card, list rows,
 * and the wrapping section that repeats the list to fill the Figma frame.
 */
import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { ExternalLink } from '@/components/ui'
import { repeatToLength, type PressPodcastRow } from '@/lib/press-engine'

import {
  Dot,
  PlayIcon,
  PressRowLink,
  RowThumbnail,
  SectionCta,
  UnderlineLabel,
} from './press-atoms'

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
  latestPodcast: PressPodcastRow
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
    <div className="h-[723px] bg-accent-tan p-3 md:h-[430px]">
      <ExternalLink
        href={latestPodcast.href}
        className="group block cursor-pointer"
      >
        <ContentWidth className="relative h-[699px] overflow-hidden rounded-xl md:h-[406px]">
          <Image
            src="/images/press-engine/podcast-hero-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover object-center blur-[20px]"
          />
          <div className="absolute left-3 top-3 flex min-h-[268px] min-w-0 flex-col justify-between text-brand-off-white md:min-h-[380px]">
            <div className="flex items-center gap-[102px]">
              <LogosMark size={6} className="shrink-0" />
              <span className="font-mono text-[10px] font-medium uppercase leading-[1.3]">
                {copy.media}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-sans text-[24px] leading-[1.1] tracking-normal">
                {copy.heroTitle}
              </h3>
              <p className="text-mono-s line-clamp-5 max-w-[453px] text-brand-off-white md:line-clamp-7">
                {copy.heroDescription}
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-2.5">
              <PlayIcon inverted />
              <span className="shrink-0 font-sans text-[14px] font-medium leading-[1.2]">
                {copy.latestEpisode}
              </span>
              <span className="min-w-0 truncate font-display text-[14px] leading-[1.2] text-gray-02">
                {latestPodcast.title}
              </span>
            </div>
          </div>
          <div className="absolute left-3 top-[342px] aspect-video w-[calc(100%-24px)] overflow-hidden rounded md:left-auto md:right-3 md:top-3 md:h-[382px] md:w-[702px] md:max-w-[calc(100%-24px)]">
            <Image
              src={latestPodcast.image}
              alt=""
              fill
              sizes="(max-width: 768px) 369px, 702px"
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
  podcast: PressPodcastRow
  index: number
  listenOnAppLabel: string
  episodePrefix: string
  fallbackEpisode: string
}) {
  const episodeLabel = podcast.episodeNumber
    ? `${episodePrefix} ${podcast.episodeNumber}`
    : fallbackEpisode

  return (
    <PressRowLink href={podcast.href} index={index} className="h-[107px]">
      <ContentWidth className="relative flex h-full items-center gap-3 md:grid md:grid-cols-[190px_524px_573px] md:gap-0">
        <RowThumbnail
          src={podcast.image}
          className="aspect-video h-auto w-[174px] shrink-0 justify-self-center"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 md:h-full md:w-[595px] md:gap-1.5 md:py-3 md:pl-3">
          <div className="text-mono-s flex items-center gap-2.5 text-brand-dark-green">
            <span>{podcast.date}</span>
            <Dot />
            <span>{episodeLabel}</span>
          </div>
          <div className="flex w-full items-center gap-2.5 md:w-[333px]">
            <PlayIcon />
            <p className="line-clamp-2 font-sans text-[18px] leading-[1.15] tracking-normal">
              {podcast.title}
            </p>
          </div>
        </div>
        <div className="hidden items-start md:flex md:gap-[132px]">
          <div className="w-[345px] py-3" />
          <div className="shrink-0 py-3">
            <UnderlineLabel>{listenOnAppLabel}</UnderlineLabel>
          </div>
        </div>
      </ContentWidth>
    </PressRowLink>
  )
}

export function PodcastsSection({
  podcasts,
  copy,
  ctaHref,
}: {
  podcasts: PressPodcastRow[]
  copy: PodcastsCopy
  ctaHref: string
}) {
  const repeatedPodcasts = repeatToLength(podcasts, 8)

  return (
    <section
      id="podcasts"
      className="h-[2249px] bg-accent-tan pt-[100px] md:h-auto"
    >
      <ContentWidth className="flex h-[22px] items-center pl-3 md:h-[26px]">
        <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em] text-brand-dark-green">
          {copy.heading}
        </h2>
      </ContentWidth>
      <div className="mt-3 bg-accent-tan">
        <PodcastHero latestPodcast={podcasts[0]} copy={copy} />
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
