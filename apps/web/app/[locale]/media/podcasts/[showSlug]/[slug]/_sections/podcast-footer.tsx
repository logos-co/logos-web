import Image from 'next/image'

import { ROUTES } from '@/constants/routes'
import type { BlogPodcastDetail } from '@/lib/blog-content'

import { MediaLink } from '../../../../_sections/blog-atoms'

interface PodcastFooterProps {
  label: string
  relatedEpisodes: BlogPodcastDetail[]
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

export function PodcastFooter({ label, relatedEpisodes }: PodcastFooterProps) {
  if (relatedEpisodes.length === 0) return null

  return (
    <section className="border-t border-brand-dark-green/50 pt-6">
      <h2 className="font-sans text-[24px] leading-none tracking-normal text-brand-dark-green md:text-[36px]">
        {label}
      </h2>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
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
                  sizes="(max-width: 768px) calc(100vw - 48px), 300px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-[18px] leading-[1.15] tracking-normal">
                {episode.title}
              </p>
              <p className="font-mono text-[10px] uppercase leading-[1.35]">
                {formatDate(episode.publishedAt)}
              </p>
            </div>
          </MediaLink>
        ))}
      </div>
    </section>
  )
}
