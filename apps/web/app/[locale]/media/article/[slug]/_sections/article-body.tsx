import Image from 'next/image'

import type {
  BlogArticleDetail,
  BlogContentBlock,
  BlogDynamicBlock,
} from '@/lib/blog-content'

interface ArticleBodyProps {
  article: BlogArticleDetail
}

function renderEmbed(src: string, html: string) {
  const isYoutube = /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.?be)\//i.test(
    src
  )

  if (isYoutube) {
    return (
      <iframe
        title={src}
        src={src.replace('watch?v=', 'embed/')}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function ArticleBlock({ block }: { block: BlogContentBlock }) {
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

function contentBlocks(article: BlogArticleDetail) {
  return (
    article.content?.filter(
      (block) =>
        block.labels.length === 0 ||
        block.labels.includes('embed') ||
        (block.labels.includes('subtitle') && block.order > 5)
    ) ?? []
  )
}

export function ArticleBody({ article }: ArticleBodyProps) {
  if (article.bodyHtml) {
    return (
      <section
        className="media-detail-content"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />
    )
  }

  if (article.blocks && article.blocks.length > 0) {
    return (
      <section className="media-detail-content">
        {article.blocks.map((block, index) => (
          <DynamicBlock
            key={`${block.type}-${index}`}
            block={block}
            index={index}
          />
        ))}
      </section>
    )
  }

  const blocks = contentBlocks(article)
  if (blocks.length === 0) return null

  return (
    <section className="media-detail-content">
      {blocks.map((block, index) => (
        <ArticleBlock
          key={`${block.type}-${block.order}-${index}`}
          block={block}
        />
      ))}
    </section>
  )
}
