'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { buildInteractiveDocument } from '@/lib/media-interactive-document'
import { observeInteractiveFrame } from '@/lib/media-interactive-frame'

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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(fixedHeight ?? 480)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    return observeInteractiveFrame(
      iframe,
      fixedHeight == null ? setHeight : undefined
    )
  }, [html, fixedHeight])

  return (
    <iframe
      ref={iframeRef}
      title={title || t('interactiveContent')}
      srcDoc={buildInteractiveDocument(html)}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      className="media-detail-interactive"
      style={{ height: fixedHeight ?? height }}
    />
  )
}
