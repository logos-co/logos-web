'use client'

import type { BlogContentBlock } from '@/lib/blog-content'
import type { BlogDynamicBlock } from '@/lib/media-blocks/types'
import { cn } from '@/lib/cn'
import { prepareCmsLinks } from '@/lib/html-links'
import { youtubeEmbedUrl } from '@/lib/media-embed'
import { MEDIA_BODY_IMAGE_SIZES } from '@/lib/media-image-sizes'

import { MediaDynamicBlock } from './media-blocks/media-dynamic-block'
import { MediaImage } from './media-image'

interface MediaRichContentProps {
  bodyHtml?: string
  blocks?: BlogDynamicBlock[]
  className?: string
  content?: BlogContentBlock[]
}

function renderEmbed(src: string, html: string) {
  const youtubeSrc = youtubeEmbedUrl(src)

  if (youtubeSrc) {
    return (
      <div className="media-detail-video-frame">
        <div className="media-detail-video-aspect">
          <iframe
            title={src}
            src={youtubeSrc}
            className="media-detail-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="media-detail-embed"
      dangerouslySetInnerHTML={{ __html: prepareCmsLinks(html) }}
    />
  )
}

function ContentBlock({ block }: { block: BlogContentBlock }) {
  if (block.type === 'image') {
    return (
      <figure className="media-detail-block-image" id={`i-${block.order}`}>
        <MediaImage image={block} sizes={MEDIA_BODY_IMAGE_SIZES} />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    )
  }

  if (block.embed) {
    return renderEmbed(block.embed.src, block.embed.html)
  }

  return (
    <div
      className="contents"
      dangerouslySetInnerHTML={{ __html: prepareCmsLinks(block.html) }}
    />
  )
}

export function MediaRichContent({
  bodyHtml,
  blocks,
  className,
  content,
}: MediaRichContentProps) {
  if (bodyHtml) {
    return (
      <section
        className={cn('media-detail-content', className)}
        dangerouslySetInnerHTML={{ __html: prepareCmsLinks(bodyHtml) }}
      />
    )
  }

  if (blocks && blocks.length > 0) {
    return (
      <section className={cn('media-detail-content', className)}>
        {blocks.map((block, index) => (
          <MediaDynamicBlock
            key={`${block.type}-${index}`}
            block={block}
            index={index}
          />
        ))}
      </section>
    )
  }

  if (!content || content.length === 0) return null

  return (
    <section className={cn('media-detail-content', className)}>
      {content.map((block, index) => (
        <ContentBlock
          key={`${block.type}-${block.order}-${index}`}
          block={block}
        />
      ))}
    </section>
  )
}
