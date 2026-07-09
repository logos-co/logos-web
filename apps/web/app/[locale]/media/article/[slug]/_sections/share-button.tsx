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
    if (navigator.share) {
      await navigator.share({ title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={() => {
        void share()
      }}
      className="cursor-pointer bg-brand-dark-green px-[10px] py-[6px] font-mono text-[10px] font-semibold leading-[1.35] text-brand-off-white transition-opacity hover:opacity-80"
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
