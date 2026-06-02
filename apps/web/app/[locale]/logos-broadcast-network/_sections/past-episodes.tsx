import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { ExternalLink } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { BlogPodcastRow } from '@/lib/blog-engine'

import type { BroadcastNetworkCopy } from './types'

function episodeLabel(podcast: BlogPodcastRow) {
  return podcast.episodeNumber
    ? `Episode ${podcast.episodeNumber}`
    : 'Logos Podcast'
}

function PlayIcon() {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex size-[30px] shrink-0 items-center justify-center rounded-full border border-brand-dark-green"
    >
      <span className="ml-0.5 h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-brand-dark-green" />
    </span>
  )
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="size-[3px] rounded-full bg-brand-dark-green"
    />
  )
}

function UnderlineLabel({ children }: { children: string }) {
  return (
    <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green underline decoration-brand-dark-green/50 underline-offset-[3px]">
      {children}
    </span>
  )
}

function EpisodeRow({
  podcast,
  index,
  listenOnApp,
}: {
  podcast: BlogPodcastRow
  index: number
  listenOnApp: string
}) {
  const background = index % 2 === 0 ? 'bg-brand-dark-green/10' : 'bg-white/10'

  return (
    <ExternalLink
      href={podcast.href}
      className={cn(
        'group block h-[107px] cursor-pointer text-brand-dark-green transition-colors hover:bg-brand-yellow',
        background
      )}
    >
      <ContentWidth className="grid h-full grid-cols-[107px_1fr] items-center gap-3 md:grid-cols-[190px_524px_573px] md:gap-0">
        <div className="relative aspect-video h-auto w-[107px] shrink-0 justify-self-center overflow-hidden md:w-[174px]">
          <Image
            src={podcast.image}
            alt=""
            fill
            sizes="174px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex h-full min-w-0 flex-col justify-center gap-1.5 py-3 pl-3">
          <div className="text-mono-s flex items-center gap-2.5">
            <span>{podcast.date}</span>
            <Dot />
            <span>{episodeLabel(podcast)}</span>
          </div>
          <div className="flex w-[333px] max-w-full items-center gap-2.5">
            <PlayIcon />
            <h3 className="line-clamp-2 font-sans text-[18px] leading-[1.15] tracking-[-0.01em]">
              {podcast.title}
            </h3>
          </div>
        </div>
        <div className="hidden items-start gap-33 md:flex">
          <div className="w-[345px] py-3" />
          <div className="shrink-0 py-3">
            <UnderlineLabel>{listenOnApp}</UnderlineLabel>
          </div>
        </div>
      </ContentWidth>
    </ExternalLink>
  )
}

export function PastEpisodes({
  podcasts,
  copy,
}: {
  podcasts: BlogPodcastRow[]
  copy: BroadcastNetworkCopy
}) {
  return (
    <section className="bg-accent-tan text-brand-dark-green">
      <ContentWidth className="pb-3">
        <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em]">
          {copy.pastEpisodes}
        </h2>
      </ContentWidth>
      {podcasts.slice(0, 4).map((podcast, index) => (
        <EpisodeRow
          key={podcast.href}
          podcast={podcast}
          index={index}
          listenOnApp={copy.listenOnApp}
        />
      ))}
    </section>
  )
}
