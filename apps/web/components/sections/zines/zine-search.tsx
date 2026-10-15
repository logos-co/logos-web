import { useEffect, useRef, useState } from 'react'
import { SearchIcon, XIcon } from '@acid-info/logos-ui'
import type { ZineIssue } from '@repo/content/schemas'
import { useTranslations } from 'next-intl'
import { articleTitle, type SearchHit } from '@/lib/zines/reader-state'

interface ZineSearchProps {
  issue: ZineIssue
  page: number
  query: string
  hits: SearchHit[]
  onQuery: (query: string) => void
  onClose: () => void
  onSelect: (hit: SearchHit) => void
}

export function ZineSearch({
  issue,
  page,
  query,
  hits,
  onQuery,
  onClose,
  onSelect,
}: ZineSearchProps) {
  const t = useTranslations('zines')
  const input = useRef<HTMLInputElement>(null)
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null)
  useEffect(() => {
    input.current?.focus()
  }, [])
  const pages = [...new Set(hits.map((hit) => hit.page))]
  const visiblePages = expandedQuery === query ? pages : pages.slice(0, 4)
  return (
    <aside className="zine-search" aria-label={t('search')}>
      <div className="zine-search-input">
        <SearchIcon />
        <input
          ref={input}
          type="search"
          value={query}
          maxLength={120}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchIssue')}
        />
        <button
          type="button"
          className="cursor-pointer"
          onClick={onClose}
          aria-label={t('closeSearch')}
        >
          <XIcon size={20} />
        </button>
      </div>
      <p className="zine-search-summary" role="status">
        {query.trim()
          ? t('results', { count: hits.length, pages: pages.length })
          : t('searchHint')}
      </p>
      <div className="zine-search-results">
        {visiblePages.map((number) => {
          const pageHits = hits.filter((hit) => hit.page === number)
          // Prefer a passage over a matching running header or article title.
          const hit =
            pageHits.find(
              (item) => item.before.length + item.after.length > 60
            ) ?? pageHits[0]
          return (
            <button
              key={number}
              type="button"
              className="zine-search-result cursor-pointer"
              aria-current={number === page ? 'page' : undefined}
              onClick={() => onSelect(hit)}
            >
              <span className="zine-result-page">
                {t('resultPage', { page: String(number).padStart(2, '0') })}
              </span>
              <span className="zine-result-title">
                {articleTitle(issue, number)}
              </span>
              <span
                className="zine-result-count"
                aria-label={t('matches', { count: pageHits.length })}
              >
                {pageHits.length}
              </span>
              <span className="zine-result-snippet">
                {hit.before}
                <mark>{hit.match}</mark>
                {hit.after}
              </span>
            </button>
          )
        })}
      </div>
      {visiblePages.length < pages.length && (
        <button
          type="button"
          className="zine-more-results cursor-pointer"
          onClick={() => setExpandedQuery(query)}
        >
          {t('morePages', { count: pages.length - visiblePages.length })}
        </button>
      )}
    </aside>
  )
}
