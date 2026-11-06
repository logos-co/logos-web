'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { buildInteractiveDocument } from '@/lib/media-interactive-document'
import {
  type FrameSize,
  type HostStorage,
  INTERACTIVE_FRAME_SANDBOX,
  measureFrame,
  observeInteractiveFrame,
  probeHostStorage,
} from '@/lib/media-interactive-frame'

interface HtmlDocumentEmbedProps {
  html: string
  title?: string
  height?: number
}

interface FrameContext {
  storage: HostStorage
  size: FrameSize
}

export function HtmlDocumentEmbed({
  html,
  title,
  height: fixedHeight,
}: HtmlDocumentEmbedProps) {
  const t = useTranslations('mediaDetail')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(fixedHeight ?? 480)
  // Only the browser knows what logos.co allows and how big the frame is, so
  // the article loads after mount, once, with both.
  const [context, setContext] = useState<FrameContext | null>(null)
  const srcDoc = useMemo(
    () =>
      context
        ? buildInteractiveDocument(html, context.storage, context.size)
        : undefined,
    [html, context]
  )

  useEffect(() => {
    const iframe = iframeRef.current
    const view = iframe?.ownerDocument.defaultView
    if (!iframe || !view) return
    setContext({ storage: probeHostStorage(view), size: measureFrame(iframe) })
  }, [])

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
      srcDoc={srcDoc}
      sandbox={INTERACTIVE_FRAME_SANDBOX}
      className="media-detail-interactive"
      style={{ height: fixedHeight ?? height }}
    />
  )
}
