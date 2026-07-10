'use client'

import { useState } from 'react'

import { MediaRichContent } from '../../../../_components/media-rich-content'
import type { BlogPodcastDetail } from '@/lib/blog-content'
import { cn } from '@/lib/cn'

import type { PodcastDetailCopy } from './types'

interface PodcastBodyProps {
  copy: PodcastDetailCopy
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

export function PodcastBody({ copy, podcast }: PodcastBodyProps) {
  const [expanded, setExpanded] = useState(false)
  const content = contentBlocks(podcast)

  if (!podcast.bodyHtml && !podcast.blocks?.length && content.length === 0) {
    return null
  }

  return (
    <div className="mt-16">
      <div className="media-podcast-transcript">
        <MediaRichContent
          bodyHtml={podcast.bodyHtml}
          blocks={podcast.blocks}
          className={cn(
            'media-podcast-content',
            !expanded && 'media-podcast-content--collapsed'
          )}
          content={content}
        />
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-5 h-10 w-full cursor-pointer border border-brand-dark-green bg-transparent font-sans text-[14px] leading-5"
          >
            {copy.showMore}
          </button>
        ) : null}
      </div>
    </div>
  )
}
