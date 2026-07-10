'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

interface MediaCollapseProps {
  children: ReactNode
  label: string
  initiallyOpen?: boolean
}

export function MediaCollapse({
  children,
  label,
  initiallyOpen = true,
}: MediaCollapseProps) {
  const [open, setOpen] = useState(initiallyOpen)

  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-full cursor-pointer items-center justify-end border border-brand-dark-green bg-transparent px-[17px] text-brand-dark-green"
      >
        <span className="absolute left-1/2 -translate-x-1/2 font-sans text-[14px] leading-5">
          {label}
        </span>
        {open ? (
          <ChevronUp aria-hidden="true" size={14} />
        ) : (
          <ChevronDown aria-hidden="true" size={14} />
        )}
      </button>
      {open ? (
        <div className="border border-brand-dark-green">{children}</div>
      ) : null}
    </section>
  )
}
