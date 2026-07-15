import { useTranslations } from 'next-intl'

import type { MediaSearchEntry } from '@/lib/media-search'
import { Link } from '@/i18n/navigation'

interface SearchResultListProps {
  entries: readonly MediaSearchEntry[]
  locale: string
}

const formatDate = (value: string | null, locale: string) =>
  value
    ? new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(value))
    : ''

export function SearchResultList({ entries, locale }: SearchResultListProps) {
  const t = useTranslations('mediaSearch')

  return (
    <div className="border-t border-brand-dark-green">
      {entries.map((entry) => (
        <Link
          key={`${entry.type}-${entry.href}`}
          href={entry.href}
          className="group grid cursor-pointer gap-5 border-b border-brand-dark-green py-6 transition-colors hover:bg-brand-dark-green hover:text-brand-off-white md:grid-cols-12 md:px-3"
        >
          <div className="flex items-start justify-between gap-4 md:col-span-3">
            <span className="font-mono text-[10px] leading-[1.3] font-medium uppercase">
              {entry.type === 'article' ? t('article') : t('podcast')}
            </span>
            <span className="font-mono text-[10px] leading-[1.3] uppercase md:hidden">
              {formatDate(entry.publishedAt, locale)}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-3 md:col-span-6">
            <h2 className="font-display text-[24px] leading-[1.02] tracking-[-0.025em] md:text-[32px]">
              {entry.title}
            </h2>
            {entry.description ? (
              <p className="max-w-[640px] font-sans text-[14px] leading-[1.45] md:text-[16px]">
                {entry.description}
              </p>
            ) : null}
          </div>
          <div className="hidden justify-end md:col-span-3 md:flex">
            <span className="font-mono text-[10px] leading-[1.3] uppercase">
              {formatDate(entry.publishedAt, locale)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
