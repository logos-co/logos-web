import Image from 'next/image'

import type {
  BlogContentBlock,
  BlogDynamicBlock,
  BlogPodcastDetail,
} from '@/lib/blog-content'

interface PodcastBodyProps {
  podcast: BlogPodcastDetail
  showNotesLabel: string
  creditsLabel: string
}

function youtubeEmbedUrl(src: string) {
  try {
    const url = new URL(src)
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube.com/embed/${id}` : src
    }
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : src
    }
  } catch {
    return src
  }

  return src
}

function renderEmbed(src: string, html: string) {
  const isYoutube = /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.?be)\//i.test(
    src
  )

  if (isYoutube) {
    return (
      <iframe
        title={src}
        src={youtubeEmbedUrl(src)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function ContentBlock({ block }: { block: BlogContentBlock }) {
  if (block.type === 'image') {
    return (
      <figure className="media-detail-block-image">
        <Image
          src={block.url}
          alt={block.alt}
          width={block.width || 1200}
          height={block.height || 630}
          sizes="(max-width: 1024px) calc(100vw - 24px), 940px"
        />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    )
  }

  if (block.embed) {
    return renderEmbed(block.embed.src, block.embed.html)
  }

  return <div dangerouslySetInnerHTML={{ __html: block.html }} />
}

function DynamicBlock({
  block,
  index,
}: {
  block: BlogDynamicBlock
  index: number
}) {
  if (block.type === 'rich-text') {
    return <div dangerouslySetInnerHTML={{ __html: block.body }} />
  }
  if (block.type === 'code-block') {
    return (
      <pre>
        <code className={block.language ? `language-${block.language}` : ''}>
          {block.code}
        </code>
      </pre>
    )
  }

  const srcDoc =
    block.fullHtml ||
    [
      '<!doctype html><html><head><meta charset="utf-8" />',
      block.css ? `<style>${block.css}</style>` : '',
      '</head><body>',
      block.html,
      block.js
        ? `<script>${block.js.replace(/<\/script>/gi, '<\\/script>')}</script>`
        : '',
      '</body></html>',
    ].join('')

  return (
    <iframe
      title={block.title || `Interactive content ${index + 1}`}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin allow-popups"
      loading="lazy"
    />
  )
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

export function PodcastBody({
  creditsLabel,
  podcast,
  showNotesLabel,
}: PodcastBodyProps) {
  const blocks = contentBlocks(podcast)
  const hasShowNotes =
    Boolean(podcast.bodyHtml) ||
    Boolean(podcast.blocks?.length) ||
    blocks.length > 0

  return (
    <div className="flex flex-col gap-12">
      {hasShowNotes ? (
        <section className="media-detail-content">
          <h2>{showNotesLabel}</h2>
          {podcast.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: podcast.bodyHtml }} />
          ) : podcast.blocks && podcast.blocks.length > 0 ? (
            podcast.blocks.map((block, index) => (
              <DynamicBlock
                key={`${block.type}-${index}`}
                block={block}
                index={index}
              />
            ))
          ) : (
            blocks.map((block, index) => (
              <ContentBlock
                key={`${block.type}-${block.order}-${index}`}
                block={block}
              />
            ))
          )}
        </section>
      ) : null}

      {podcast.creditsHtml ? (
        <section className="media-detail-content">
          <h2>{creditsLabel}</h2>
          <div dangerouslySetInnerHTML={{ __html: podcast.creditsHtml }} />
        </section>
      ) : null}
    </div>
  )
}
