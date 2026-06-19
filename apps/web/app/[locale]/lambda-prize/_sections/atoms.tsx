/**
 * Shared presentational atoms for the Lambda Prize page sections.
 */
import { ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

import type { RowCopy } from './types'

export function TertiaryCta({
  href,
  children,
  tone = 'dark',
}: {
  href: string
  children: string
  tone?: 'dark' | 'light'
}) {
  return (
    <Link
      href={href}
      className={`inline-flex cursor-pointer items-center gap-1 border-b pb-0.5 font-mono text-[10px] font-semibold uppercase leading-[1.35] ${
        tone === 'light'
          ? 'border-brand-off-white/50 text-brand-off-white'
          : 'border-brand-dark-green/50 text-brand-dark-green'
      }`}
    >
      {children}
      <ButtonArrowIcon />
    </Link>
  )
}

export function DataRows({
  rows,
  lastBorder = true,
}: {
  rows: RowCopy[]
  lastBorder?: boolean
}) {
  return (
    <div className="flex flex-col">
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className={`flex min-h-[36px] min-w-0 flex-col border-t border-brand-dark-green/50 py-3 lg:grid lg:min-h-[31px] lg:grid-cols-2 ${
            lastBorder ? 'last:border-b' : ''
          }`}
        >
          <p className="text-eyebrow min-w-0 uppercase">{row.label}</p>
          <p className="text-mono-s min-w-0 pr-2 break-words [overflow-wrap:anywhere]">
            {row.body}
          </p>
        </div>
      ))}
    </div>
  )
}
