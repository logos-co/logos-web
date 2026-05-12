/**
 * Podcast sections used by the `/press` page: hero card, list rows,
 * and the wrapping section that repeats the list to fill the Figma frame.
 */
import Image from 'next/image'
import { LogosMark } from '@repo/ui'

import {
  PRESS_ORIGIN,
  repeatToLength,
  type PressPodcastRow,
} from '@/lib/press-engine'

import {
  Dot,
  PlayIcon,
  PressRowLink,
  RowThumbnail,
  SectionCta,
  TextLink,
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
      <div className="relative h-[699px] overflow-hidden rounded-xl md:h-[406px]">
        <Image
          src="/images/press-engine/podcast-hero-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover object-center blur-[20px]"
        />
        <div className="absolute left-3 top-3 flex h-[268px] w-[345px] max-w-[calc(100%-24px)] flex-col justify-between text-brand-off-white md:h-[380px] md:w-[453px]">
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
            <p className="text-mono-s max-w-[453px] text-brand-off-white">
              {copy.heroDescription}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <PlayIcon inverted />
            <span className="font-sans text-[14px] font-medium leading-[1.2]">
              {copy.latestEpisode}
            </span>
            <span className="font-display text-[14px] leading-[1.2] whitespace-nowrap text-gray-02">
              {latestPodcast.title}
            </span>
          </div>
        </div>
        <div className="absolute left-3 top-[397px] flex h-[290px] w-[350px] items-center justify-center rounded-[100px] bg-accent-tan md:left-auto md:right-3 md:top-3 md:h-[382px] md:w-[702px] md:max-w-[calc(100%-24px)]">
          <TextLink href={PRESS_ORIGIN} className="no-underline">
            {copy.seeAllEpisodes}
          </TextLink>
        </div>
      </div>
    </div>
  )
}

function PodcastEntry({
  podcast,
  index,
  listenOnAppLabel,
}: {
  podcast: PressPodcastRow
  index: number
  listenOnAppLabel: string
}) {
  const episodeLabel = podcast.episodeNumber
    ? `Episode ${podcast.episodeNumber}`
    : 'Logos Podcast'

  return (
    <PressRowLink
      href={podcast.href}
      index={index}
      className="h-[174px] md:h-[131px]"
    >
      <RowThumbnail
        src={podcast.image}
        className="right-[11px] top-3 w-[107px] md:left-3 md:right-auto"
      />
      <div className="absolute left-3 top-[13px] flex w-[238px] flex-col gap-2.5 md:hidden">
        <PlayIcon />
        <p className="font-sans text-[18px] leading-[1.15] tracking-[-0.01em]">
          {podcast.title}
        </p>
      </div>
      <div className="text-mono-s absolute bottom-[15px] left-3 flex items-center gap-2.5 text-brand-dark-green md:hidden">
        <span>{podcast.date}</span>
        <Dot />
        <span>{episodeLabel}</span>
      </div>
      <div className="absolute bottom-[13px] right-[11px] md:hidden">
        <UnderlineLabel>{listenOnAppLabel}</UnderlineLabel>
      </div>
      <div className="hidden min-h-[131px] flex-col justify-between pb-3 pl-[131px] pr-3 pt-3 md:absolute md:left-[119px] md:top-0 md:grid md:h-[119px] md:w-[1150px] md:grid-cols-[595px_345px_1fr] md:gap-x-3 md:p-0">
        <div className="flex flex-col justify-between md:h-[131px] md:py-3 md:pl-3">
          <div className="text-mono-s flex items-center gap-2.5 text-brand-dark-green">
            <span>{podcast.date}</span>
            <Dot />
            <span>{episodeLabel}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <PlayIcon />
            <p className="font-sans text-[18px] leading-[1.15] tracking-normal">
              {podcast.title}
            </p>
          </div>
        </div>
        <div />
        <div className="md:py-3">
          <UnderlineLabel>{listenOnAppLabel}</UnderlineLabel>
        </div>
      </div>
    </PressRowLink>
  )
}

export function PodcastsSection({
  podcasts,
  copy,
}: {
  podcasts: PressPodcastRow[]
  copy: PodcastsCopy
}) {
  const repeatedPodcasts = repeatToLength(podcasts, 8)

  return (
    <section
      id="podcasts"
      className="h-[2249px] bg-accent-tan pt-[100px] md:h-auto"
    >
      <div className="flex h-[22px] items-center pl-3 md:h-[26px]">
        <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em] text-brand-dark-green">
          {copy.heading}
        </h2>
      </div>
      <div className="mt-3 bg-accent-tan">
        <PodcastHero latestPodcast={podcasts[0]} copy={copy} />
        {repeatedPodcasts.map((podcast, index) => (
          <PodcastEntry
            key={`${podcast.title}-${index}`}
            podcast={podcast}
            index={index}
            listenOnAppLabel={copy.listenOnApp}
          />
        ))}
        <SectionCta href={`${PRESS_ORIGIN}/podcasts`} label={copy.heading} />
      </div>
    </section>
  )
}
