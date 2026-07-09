'use client'

import { useState } from 'react'

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
      className="shrink-0 cursor-pointer border border-brand-dark-green px-2 py-1 font-sans text-[14px] leading-5 text-brand-dark-green transition-colors hover:bg-brand-dark-green hover:text-brand-off-white"
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
