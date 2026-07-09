import { PodcastBody } from './podcast-body'
import { PodcastFooter } from './podcast-footer'
import { PodcastHero } from './podcast-hero'
import type { PodcastDetailSectionProps } from './types'

interface PodcastDetailPageProps extends PodcastDetailSectionProps {
  canonicalUrl: string
}

export function PodcastDetailPage({
  canonicalUrl,
  copy,
  podcast,
}: PodcastDetailPageProps) {
  return (
    <div className="bg-accent-tan pb-40 pt-28 text-brand-dark-green">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12 px-3 pb-24 lg:grid-cols-[250px_minmax(0,940px)_1fr] lg:gap-[119px]">
        <div aria-hidden="true" className="hidden lg:block" />
        <article className="flex min-w-0 flex-col gap-12">
          <PodcastHero
            canonicalUrl={canonicalUrl}
            copy={copy}
            podcast={podcast}
          />
          <PodcastBody
            creditsLabel={copy.credits}
            podcast={podcast}
            showNotesLabel={copy.showNotes}
          />
          <PodcastFooter
            label={copy.relatedEpisodes}
            relatedEpisodes={podcast.relatedEpisodes}
          />
        </article>
        <div aria-hidden="true" className="hidden lg:block" />
      </div>
    </div>
  )
}
