/**
 * Shared presentational atoms for the Book page sections.
 */
import { IconMask } from '@/components/icons/icon-mask'
import { BOOK_DOWNLOADS } from '@/constants/book-assets'

import type { BookActionItem } from './types'

const actions: readonly BookActionItem[] = [
  {
    label: 'Amazon',
    subtext: 'Print/Kindle',
    href: 'https://www.amazon.com/Farewell-Westphalia-Sovereignty-Post-Nation-State-Governance/dp/B0FQLV79ZN/ref=tmm_pap_swatch_0',
    external: true,
  },
  {
    label: 'Open source',
    subtext: 'Free',
    href: BOOK_DOWNLOADS.fossEditionEn,
    external: true,
  },
  {
    label: 'Non-Amazon',
    subtext: 'Ereader',
    href: 'https://books2read.com/u/3nzEAx',
    external: true,
  },
  {
    label: 'Translations',
    subtext: 'Free',
    href: '#translations',
    external: false,
  },
] as const

export function BookAction({
  label,
  subtext,
  href,
  external,
}: {
  label: string
  subtext: string
  href: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex min-w-[150px] items-center justify-between gap-4 rounded-xl bg-brand-off-white px-4 py-3 text-brand-dark-green transition-colors hover:bg-gray-01 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-off-white"
    >
      <span className="flex flex-col">
        <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35]">
          {label}
        </span>
        <span className="font-mono text-[9px] leading-[1.35] opacity-60">
          {subtext}
        </span>
      </span>
      <IconMask src="/icons/right-arrow.svg" className="size-[15px]" />
    </a>
  )
}

export function ActionGroup({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      {actions.map((action) => (
        <BookAction key={action.label} {...action} />
      ))}
    </div>
  )
}
