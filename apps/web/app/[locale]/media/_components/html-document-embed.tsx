'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { buildInteractiveDocument } from '@/lib/media-interactive-document'

interface HtmlDocumentEmbedProps {
  html: string
  title?: string
  height?: number
}

export function HtmlDocumentEmbed({
  html,
  title,
  height: fixedHeight,
}: HtmlDocumentEmbedProps) {
  const t = useTranslations('mediaDetail')
  const frameId = useId()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(fixedHeight ?? 480)

  useEffect(() => {
    if (fixedHeight != null) return

    const handleMessage = (event: MessageEvent) => {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        typeof event.data !== 'object' ||
        event.data === null ||
        event.data.type !== 'logos-media-embed-height' ||
        event.data.frameId !== frameId ||
        typeof event.data.height !== 'number' ||
        !Number.isFinite(event.data.height) ||
        event.data.height <= 0
      ) {
        return
      }
      setHeight(Math.ceil(event.data.height))
    }

    window.addEventListener('message', handleMessage)
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'logos-media-embed-request-height', frameId },
      '*'
    )
    return () => window.removeEventListener('message', handleMessage)
  }, [fixedHeight, frameId])

  return (
    <iframe
      ref={iframeRef}
      title={title || t('interactiveContent')}
      srcDoc={buildInteractiveDocument(html, frameId)}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      className="media-detail-interactive"
      style={{ height: fixedHeight ?? height }}
    />
  )
}
