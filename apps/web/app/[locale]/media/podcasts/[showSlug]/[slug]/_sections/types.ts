import type { BlogPodcastDetail } from '@/lib/blog-content'
import type { PodcastPlayerCopy } from '../../../../_components/podcast-player-context'

export interface PodcastDetailCopy extends PodcastPlayerCopy {
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
