import Image from 'next/image'

import { ExternalLink } from '@/components/ui'

import { ShareButton } from '../../../../_components/share-button'
import { PodcastPlayer } from './podcast-player'
import type { PodcastDetailSectionProps } from './types'

interface PodcastHeroProps extends PodcastDetailSectionProps {
  canonicalUrl: string
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatChannelName(value: string) {
  return value.replace(/_/g, ' ')
}

export function PodcastHero({ canonicalUrl, copy, podcast }: PodcastHeroProps) {
  const date = formatDate(podcast.publishedAt)
  const episodeLabel = podcast.episodeNumber
    ? copy.episode.replace('{count}', String(podcast.episodeNumber))
    : ''
  const showTitle = podcast.show?.title ?? 'Logos State'

  return (
    <section className="flex flex-col gap-6">
      <PodcastPlayer
        channels={podcast.channels}
        copy={copy}
        coverImage={podcast.coverImage}
        showTitle={showTitle}
        title={podcast.title}
      />

      <div className="flex flex-wrap items-center gap-12 font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green">
        {episodeLabel ? <span>{episodeLabel}</span> : null}
        {date ? <span>{date}</span> : null}
      </div>

      <div className="flex flex-col gap-4 text-brand-dark-green">
        <h1 className="font-display text-[40px] leading-none tracking-normal md:text-[56px]">
          {podcast.title}
        </h1>
        {podcast.show ? (
          <div className="flex items-center gap-3">
            {podcast.show.logo ? (
              <Image
                src={podcast.show.logo.url}
                alt={podcast.show.logo.alt}
                width={24}
                height={24}
                className="size-6 object-contain"
              />
            ) : null}
            <p className="font-sans text-[12px] font-medium leading-[1.2] tracking-normal">
              {podcast.show.title}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        {podcast.tags.map((tag) => (
          <span
            key={tag.id || tag.name}
            className="border border-brand-dark-green px-[10px] py-[6px] font-mono text-[10px] font-semibold leading-[1.35] text-brand-dark-green"
          >
            {tag.name}
          </span>
        ))}
        <ShareButton
          label={copy.share}
          copiedLabel={copy.copied}
          title={podcast.title}
          url={canonicalUrl}
        />
      </div>

      {podcast.channels.length > 0 ? (
        <div className="flex flex-col gap-3 border-y border-brand-dark-green/50 py-6">
          <p className="font-mono text-[10px] font-semibold uppercase leading-[1.35]">
            {copy.listen}
          </p>
          <div className="flex flex-wrap gap-3">
            {podcast.channels.map((channel) => (
              <ExternalLink
                key={`${channel.name}-${channel.url}`}
                href={channel.url}
                className="cursor-pointer border border-brand-dark-green px-[10px] py-[6px] font-mono text-[10px] font-semibold leading-[1.35] text-brand-dark-green transition-colors hover:bg-brand-yellow"
              >
                {formatChannelName(channel.name)}
              </ExternalLink>
            ))}
          </div>
        </div>
      ) : null}

      {podcast.description ? (
        <div className="border-y border-brand-dark-green/50 py-6 md:py-12">
          <p className="font-sans text-[24px] leading-none tracking-normal text-brand-dark-green md:text-[36px]">
            {podcast.description}
          </p>
        </div>
      ) : null}
    </section>
  )
}
