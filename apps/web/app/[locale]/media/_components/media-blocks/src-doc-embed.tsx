'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import type { BlogDynamicBlock } from '@/lib/media-blocks/types'
import { injectEmbedCsp } from '@/lib/media-interactive-document'

function buildSrcDoc(
  block: Extract<BlogDynamicBlock, { type: 'interactive-embed' }>,
  frameId: string
): string {
  const linkScript = `<script>(function(){var links=document.querySelectorAll('a[href]');for(var i=0;i<links.length;i++){var link=links[i];if(!link.target)link.target='_blank';link.rel='noopener noreferrer';}})();</script>`
  const heightScript = `<script>(function(){var frameId=${JSON.stringify(frameId)};var last=-1;function post(){var height=Math.max(document.documentElement?document.documentElement.scrollHeight:0,document.body?document.body.scrollHeight:0);if(height===last)return;last=height;parent.postMessage({type:'logos-media-embed-height',frameId:frameId,height:height},'*');}function observe(){try{var root=document.documentElement||document.body;if(!root)return;new MutationObserver(post).observe(root,{childList:true,subtree:true,attributes:true,characterData:true});if(typeof ResizeObserver!=='undefined')new ResizeObserver(post).observe(root);}catch(error){}}function retry(count){post();if(count<20)setTimeout(function(){retry(count+1)},500)}window.addEventListener('message',function(event){var data=event.data;if(data&&data.type==='logos-media-embed-request-height'&&data.frameId===frameId)post();});window.addEventListener('load',post);window.addEventListener('resize',post);observe();window.addEventListener('DOMContentLoaded',observe);retry(0);})();</script>`
  // Full HTML documents never reach here: HtmlDocumentEmbed renders them.
  const source = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>html,body{margin:0;padding:0;overflow:hidden}${block.css ?? ''}</style></head><body>${block.html}${block.js ? `<script>${block.js.replace(/<[/]script>/gi, '<\\/script>')}</script>` : ''}</body></html>`
  const withCsp = injectEmbedCsp(source)

  return /<[/]body>/i.test(withCsp)
    ? withCsp.replace(/<[/]body>/i, `${linkScript}${heightScript}</body>`)
    : `${withCsp}${linkScript}${heightScript}`
}

export function SrcDocEmbed({
  block,
  index,
}: {
  block: Extract<BlogDynamicBlock, { type: 'interactive-embed' }>
  index: number
}) {
  const t = useTranslations('mediaDetail')
  const frameId = useMemo(() => `logos-media-embed-${index}`, [index])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(block.height ?? 480)
  const requestHeight = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'logos-media-embed-request-height', frameId },
      '*'
    )
  }, [frameId])

  useEffect(() => {
    if (block.height != null) return

    const handleMessage = (event: MessageEvent) => {
      if (
        event.source !== iframeRef.current?.contentWindow ||
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
    requestHeight()
    const requestTimer = window.setInterval(requestHeight, 500)
    const stopRequestTimer = window.setTimeout(
      () => window.clearInterval(requestTimer),
      10000
    )
    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(requestTimer)
      window.clearTimeout(stopRequestTimer)
    }
  }, [block.height, frameId, requestHeight])

  return (
    <iframe
      ref={iframeRef}
      title={block.title || t('interactiveContent')}
      srcDoc={buildSrcDoc(block, frameId)}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      loading="lazy"
      className="media-detail-interactive"
      style={{ height }}
      onLoad={requestHeight}
    />
  )
}
