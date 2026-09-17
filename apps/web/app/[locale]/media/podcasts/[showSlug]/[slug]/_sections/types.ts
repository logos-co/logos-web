import type { BlogPodcastDetail } from '@/lib/blog-content'
import type { BreadcrumbItem } from '@/lib/structured-data'
import type { PodcastPlayerCopy } from '../../../../_components/podcast-player-context'

export interface PodcastDetailCopy extends PodcastPlayerCopy {
  breadcrumb: string
  channels: string
  copied: string
  credits: string
  listen: string
  minutes: string
  relatedEpisodes: string
  references: string
  share: string
  showLess: string
  showMore: string
  showNotes: string
}

export interface PodcastDetailSectionProps {
  copy: PodcastDetailCopy
  podcast: BlogPodcastDetail
}

export interface PodcastBreadcrumbProps {
  /** Parent sections shown above the player. */
  breadcrumbs: ReadonlyArray<BreadcrumbItem>
}
