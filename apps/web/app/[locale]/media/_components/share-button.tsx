'use client'

import { useState } from 'react'

import { MediaShareIcon } from '@acid-info/logos-ui'

interface ShareButtonProps {
  label: string
  copiedLabel: string
  title: string
  url: string
}

export function ShareButton({
  label,
  copiedLabel,
  title,
  url,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void share()
      }}
      className="flex h-6 shrink-0 cursor-pointer items-center gap-2 border border-brand-dark-green py-1 pr-2 pl-[6px] font-sans text-[12px] leading-4 text-brand-dark-green transition-colors hover:bg-brand-dark-green hover:text-brand-off-white"
    >
      <MediaShareIcon />
      {copied ? copiedLabel : label}
    </button>
  )
}
