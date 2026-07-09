import type { BlogPodcastDetail } from '@/lib/blog-content'

export interface PodcastPlayerCopy {
  play: string
  pause: string
  rewind: string
  forward: string
  seek: string
}

export interface PodcastDetailCopy extends PodcastPlayerCopy {
  channels: string
  copied: string
  credits: string
  episode: string
  listen: string
  relatedEpisodes: string
  share: string
  showNotes: string
}

export interface PodcastDetailSectionProps {
  copy: PodcastDetailCopy
  podcast: BlogPodcastDetail
}
