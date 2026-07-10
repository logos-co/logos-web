import Image from 'next/image'

import {
  ApplePodcastsIcon,
  GooglePodcastsIcon,
  SpotifyIcon,
} from '@acid-info/logos-ui'

import { ExternalLink } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

import { MediaSummary } from '../../../../_components/media-summary'
import { ShareButton } from '../../../../_components/share-button'
import { PodcastPlayer } from './podcast-player'
import { PodcastStats } from './podcast-stats'
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
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function channelIcon(value: string) {
  const channel = value.toLowerCase().replace(/[\s_]/g, '')
  if (channel === 'spotify') return <SpotifyIcon />
  if (channel === 'applepodcasts') return <ApplePodcastsIcon />
  if (channel === 'googlepodcasts') return <GooglePodcastsIcon />
  return null
}

export function PodcastHero({ canonicalUrl, copy, podcast }: PodcastHeroProps) {
  const date = formatDate(podcast.publishedAt)
  const episodeId = podcast.id || `${podcast.showSlug}/${podcast.slug}`
  const listeningChannels = podcast.channels.filter(
    (channel) => !['youtube', 'simplecast'].includes(channel.name.toLowerCase())
  )

  return (
    <section className="flex flex-col">
      <PodcastPlayer copy={copy} podcast={podcast} />

      <PodcastStats
        date={date}
        episodeId={episodeId}
        minutesLabel={copy.minutes}
      />

      <div className="mt-3 flex flex-col text-brand-dark-green">
        <h1 className="font-display text-[36px] leading-[48px] tracking-normal max-sm:text-[20px] max-sm:leading-[30px]">
          {podcast.title}
        </h1>
        {podcast.show ? (
          <div className="mt-4 flex items-center gap-3 max-sm:mt-2">
            {podcast.show.logo ? (
              <Image
                src={podcast.show.logo.url}
                alt={podcast.show.logo.alt}
                width={24}
                height={24}
                className="size-6 object-contain"
              />
            ) : null}
            <Link
              href={ROUTES.mediaPodcastsSection}
              className="cursor-pointer font-sans text-[14px] leading-5 tracking-normal no-underline"
            >
              {podcast.show.title}
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex w-fit max-w-full items-start gap-4">
        <div className="flex flex-wrap gap-2">
          {podcast.tags.map((tag) => (
            <span
              key={tag.id || tag.name}
              className="flex h-6 items-center border border-brand-dark-green px-[7px] py-[3px] font-sans text-[12px] leading-4 text-brand-dark-green capitalize"
            >
              {tag.name.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
        <span
          aria-hidden="true"
          className="mt-1.5 h-3 border-l border-brand-dark-green"
        />
        <ShareButton
          label={copy.share}
          copiedLabel={copy.copied}
          title={podcast.title}
          url={canonicalUrl}
        />
      </div>

      {listeningChannels.length > 0 ? (
        <div className="my-8 flex flex-col gap-4 max-sm:my-6">
          <p className="sr-only">{copy.listen}</p>
          <div className="flex flex-wrap gap-6">
            {listeningChannels.map((channel) => (
              <ExternalLink
                key={`${channel.name}-${channel.url}`}
                href={channel.url}
                className="flex cursor-pointer items-center gap-2 font-sans text-[14px] leading-5 text-brand-dark-green no-underline hover:underline"
              >
                {channelIcon(channel.name)}
                {formatChannelName(channel.name)}
              </ExternalLink>
            ))}
          </div>
        </div>
      ) : null}

      <MediaSummary html={podcast.summaryHtml} text={podcast.description} />
    </section>
  )
}
