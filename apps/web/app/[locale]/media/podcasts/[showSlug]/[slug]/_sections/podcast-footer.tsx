'use client'

import Image from 'next/image'
import { useState } from 'react'

import { ROUTES } from '@/constants/routes'
import type { BlogPodcastDetail } from '@/lib/blog-content'

import { MediaCollapse } from '../../../../_components/media-collapse'
import { MediaRichContent } from '../../../../_components/media-rich-content'
import { MediaLink } from '../../../../_sections/blog-atoms'
import type { PodcastDetailCopy } from './types'

interface PodcastFooterProps {
  copy: PodcastDetailCopy
  podcast: BlogPodcastDetail
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function PodcastFooter({ copy, podcast }: PodcastFooterProps) {
  const [showAll, setShowAll] = useState(false)
  const relatedEpisodes = showAll
    ? podcast.relatedEpisodes
    : podcast.relatedEpisodes.slice(0, 4)

  return (
    <footer className="mt-14 pb-20 max-sm:mt-[72px]">
      <div className="[&>section+section]:-mt-px">
        {podcast.creditsHtml || podcast.credits.length > 0 ? (
          <MediaCollapse label={copy.credits}>
            <MediaRichContent
              bodyHtml={podcast.creditsHtml}
              className="px-[14px] py-3"
              content={podcast.credits}
            />
          </MediaCollapse>
        ) : null}

        {podcast.footnotes.length > 0 ? (
          <MediaCollapse label={copy.references}>
            {podcast.footnotes.map((footnote) => (
              <div
                key={footnote.id}
                id={`fnt-${footnote.id}`}
                className="flex gap-1 px-[14px] py-2 font-sans text-[14px] leading-5"
              >
                <a
                  href={`#${footnote.refId}`}
                  className="shrink-0 cursor-pointer no-underline hover:underline"
                >
                  {footnote.refValue.replace('[', '').replace(']', '')}.
                </a>
                <span
                  dangerouslySetInnerHTML={{ __html: footnote.valueHTML }}
                />
              </div>
            ))}
          </MediaCollapse>
        ) : null}
      </div>

      {podcast.relatedEpisodes.length > 0 ? (
        <section className="mt-16 max-sm:mt-8">
          <h2 className="font-display text-[36px] leading-[48px] max-sm:text-[20px] max-sm:leading-[30px]">
            {copy.relatedEpisodes}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {relatedEpisodes.map((episode) => (
              <MediaLink
                key={episode.id || episode.slug}
                href={ROUTES.mediaPodcast(episode.showSlug, episode.slug)}
                className="group flex cursor-pointer flex-col gap-3 border border-brand-dark-green/50 p-3 text-brand-dark-green transition-colors hover:bg-brand-yellow"
              >
                {episode.coverImage ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-brand-dark-green/10">
                    <Image
                      src={episode.coverImage.url}
                      alt={episode.coverImage.alt}
                      fill
                      sizes="(max-width: 767px) calc(100vw - 56px), 330px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  <p className="font-display text-[20px] leading-[30px]">
                    {episode.title}
                  </p>
                  <p className="font-sans text-[12px] leading-4">
                    {formatDate(episode.publishedAt)}
                  </p>
                </div>
              </MediaLink>
            ))}
          </div>

          {podcast.relatedEpisodes.length > 4 ? (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-12 h-10 w-full cursor-pointer border border-brand-dark-green bg-transparent font-sans text-[14px] leading-5"
            >
              {showAll ? copy.showLess : copy.showMore}
            </button>
          ) : null}
        </section>
      ) : null}
    </footer>
  )
}
