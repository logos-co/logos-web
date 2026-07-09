import { MediaRichContent } from '../../../../_components/media-rich-content'
import type { BlogPodcastDetail } from '@/lib/blog-content'

interface PodcastBodyProps {
  podcast: BlogPodcastDetail
}

function contentBlocks(podcast: BlogPodcastDetail) {
  return (
    podcast.content?.filter(
      (block) =>
        block.labels.length === 0 ||
        block.labels.includes('embed') ||
        (block.labels.includes('subtitle') && block.order > 5)
    ) ?? []
  )
}

export function PodcastBody({ podcast }: PodcastBodyProps) {
  const content = contentBlocks(podcast)

  if (!podcast.bodyHtml && !podcast.blocks?.length && content.length === 0) {
    return null
  }

  return (
    <div className="mt-16">
      <MediaRichContent
        bodyHtml={podcast.bodyHtml}
        blocks={podcast.blocks}
        className="media-podcast-content"
        content={content}
      />
    </div>
  )
}
