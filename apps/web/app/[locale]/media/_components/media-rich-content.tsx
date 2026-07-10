'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { BlogContentBlock, BlogDynamicBlock } from '@/lib/blog-content'
import { cn } from '@/lib/cn'
import { youtubeEmbedUrl } from '@/lib/media-embed'

interface MediaRichContentProps {
  bodyHtml?: string
  blocks?: BlogDynamicBlock[]
  className?: string
  content?: BlogContentBlock[]
}

const EMBED_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; media-src https:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; connect-src https:; frame-src https:;">`

function addTargetBlank(html: string): string {
  return html.replace(
    /<a\b(?![^>]*\btarget=)([^>]*?)>/gi,
    '<a target="_blank" rel="noopener noreferrer"$1>'
  )
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
      dangerouslySetInnerHTML={{ __html: addTargetBlank(html) }}
    />
  )
}

function ContentBlock({ block }: { block: BlogContentBlock }) {
  if (block.type === 'image') {
    return (
      <figure className="media-detail-block-image" id={`i-${block.order}`}>
        <Image
          src={block.url}
          alt={block.alt}
          width={block.width || 1200}
          height={block.height || 630}
          sizes="(max-width: 767px) calc(100vw - 24px), 700px"
        />
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
      dangerouslySetInnerHTML={{ __html: addTargetBlank(block.html) }}
    />
  )
}

function injectCsp(html: string): string {
  if (/<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(html)) {
    return html
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${EMBED_CSP}`)
  }
  return `<!doctype html><html><head><meta charset="utf-8" />${EMBED_CSP}</head><body>${html}</body></html>`
}

function buildSrcDoc(
  block: Extract<BlogDynamicBlock, { type: 'interactive-embed' }>,
  frameId: string
): string {
  const linkScript = `<script>(function(){var links=document.querySelectorAll('a[href]');for(var i=0;i<links.length;i++){var link=links[i];if(!link.target)link.target='_blank';link.rel='noopener noreferrer';}})();</script>`
  const heightScript = `<script>(function(){var frameId=${JSON.stringify(frameId)};var last=-1;function post(){var height=Math.max(document.documentElement?document.documentElement.scrollHeight:0,document.body?document.body.scrollHeight:0);if(height===last)return;last=height;parent.postMessage({type:'logos-media-embed-height',frameId:frameId,height:height},'*');}function observe(){var root=document.documentElement||document.body;if(!root)return;new MutationObserver(post).observe(root,{childList:true,subtree:true,attributes:true,characterData:true});if(typeof ResizeObserver!=='undefined')new ResizeObserver(post).observe(root);}window.addEventListener('load',post);window.addEventListener('resize',post);observe();window.addEventListener('DOMContentLoaded',observe);setTimeout(post,120);setTimeout(post,600);})();</script>`
  const source = block.fullHtml?.trim()
    ? block.fullHtml
    : `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>html,body{margin:0;padding:0;overflow:hidden}${block.css ?? ''}</style></head><body>${block.html}${block.js ? `<script>${block.js.replace(/<[/]script>/gi, '<\\/script>')}</script>` : ''}</body></html>`
  const withCsp = injectCsp(source)

  return /<[/]body>/i.test(withCsp)
    ? withCsp.replace(/<[/]body>/i, `${linkScript}${heightScript}</body>`)
    : `${withCsp}${linkScript}${heightScript}`
}

function InteractiveEmbed({
  block,
  index,
}: {
  block: Extract<BlogDynamicBlock, { type: 'interactive-embed' }>
  index: number
}) {
  const frameId = useMemo(() => `logos-media-embed-${index}`, [index])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(block.height ?? 480)

  useEffect(() => {
    if (block.height != null) return

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      if (
        typeof event.data !== 'object' ||
        event.data === null ||
        event.data.type !== 'logos-media-embed-height' ||
        event.data.frameId !== frameId ||
        typeof event.data.height !== 'number'
      ) {
        return
      }
      setHeight(Math.max(1, Math.min(event.data.height, 10000)))
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [block.height, frameId])

  return (
    <iframe
      ref={iframeRef}
      title={block.title || `Interactive content ${index + 1}`}
      srcDoc={buildSrcDoc(block, frameId)}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      loading="lazy"
      className="media-detail-interactive"
      style={{ height }}
    />
  )
}

function DynamicBlock({
  block,
  index,
}: {
  block: BlogDynamicBlock
  index: number
}) {
  if (block.type === 'rich-text') {
    return (
      <div
        className="contents"
        dangerouslySetInnerHTML={{ __html: addTargetBlank(block.body) }}
      />
    )
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

  return <InteractiveEmbed block={block} index={index} />
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
        dangerouslySetInnerHTML={{ __html: addTargetBlank(bodyHtml) }}
      />
    )
  }

  if (blocks && blocks.length > 0) {
    return (
      <section className={cn('media-detail-content', className)}>
        {blocks.map((block, index) => (
          <DynamicBlock
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
