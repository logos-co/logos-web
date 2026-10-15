'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface Passage {
  page: number
  start: number
  end: number
  text: string
  x: number
  y: number
}

export function ZineSelection({ locationKey }: { locationKey: string }) {
  const t = useTranslations('zines')
  const [passage, setPassage] = useState<Passage | null>(null)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const update = (): void => {
      const selection = window.getSelection()
      const first = selection?.anchorNode?.parentElement?.closest('[data-word]')
      const last = selection?.focusNode?.parentElement?.closest('[data-word]')
      if (
        !selection ||
        selection.isCollapsed ||
        !first ||
        !last ||
        first.getAttribute('data-page') !== last.getAttribute('data-page')
      ) {
        setPassage(null)
        return
      }
      const start = Number(first.getAttribute('data-word'))
      const end = Number(last.getAttribute('data-word'))
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      setPassage({
        page: Number(first.getAttribute('data-page')),
        start: Math.min(start, end),
        end: Math.max(start, end) + 1,
        text: selection.toString(),
        x: Math.max(8, Math.min(rect.left, window.innerWidth - 300)),
        y: Math.min(window.innerHeight - 48, rect.bottom + 8),
      })
      setNotice('')
    }
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [locationKey])
  const copy = async (link: boolean): Promise<void> => {
    if (!passage) return
    const url = new URL(window.location.href)
    url.search = new URLSearchParams({
      page: String(passage.page),
      start: String(passage.start),
      end: String(passage.end),
    }).toString()
    try {
      await navigator.clipboard.writeText(link ? url.href : passage.text)
      setNotice(t(link ? 'linkCopied' : 'copied'))
    } catch {
      setNotice(t('copyFailed'))
    }
  }
  return (
    <>
      {passage && (
        <div
          className="zine-selection"
          style={{ left: passage.x, top: passage.y }}
          onPointerDown={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => void copy(false)}
          >
            {t('copy')}
          </button>
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => void copy(true)}
          >
            {t('copyLink')}
          </button>
        </div>
      )}
      <span className="zine-copy-status" role="status">
        {notice}
      </span>
    </>
  )
}
