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
    <div className="bg-accent-tan pb-20 pt-[94px] text-brand-dark-green">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 px-4 pb-24 lg:grid-cols-[repeat(16,minmax(0,1fr))] lg:gap-4">
        <article className="flex min-w-0 max-w-[696px] flex-col lg:col-span-8 lg:col-start-5">
          <PodcastHero
            canonicalUrl={canonicalUrl}
            copy={copy}
            podcast={podcast}
          />
          <PodcastBody podcast={podcast} />
          <PodcastFooter copy={copy} podcast={podcast} />
        </article>
      </div>
    </div>
  )
}
