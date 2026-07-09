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
        className="flex h-10 w-full cursor-pointer items-center justify-between border border-brand-dark-green bg-transparent px-[17px] text-brand-dark-green"
      >
        <span className="mx-auto font-sans text-[14px] leading-5">{label}</span>
        {open ? (
          <ChevronUp aria-hidden="true" size={16} />
        ) : (
          <ChevronDown aria-hidden="true" size={16} />
        )}
      </button>
      {open ? (
        <div className="border border-t-0 border-brand-dark-green">
          {children}
        </div>
      ) : null}
    </section>
  )
}
