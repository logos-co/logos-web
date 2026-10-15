import { useEffect, useRef } from 'react'
import { SearchIcon, XIcon } from '@acid-info/logos-ui'
import type { ZineIssue } from '@repo/content/schemas'
import { useTranslations } from 'next-intl'
import { articleTitle, type SearchHit } from '@/lib/zines/reader-state'

interface ZineSearchProps {
  issue: ZineIssue
  query: string
  hits: SearchHit[]
  onQuery: (query: string) => void
  onClose: () => void
  onSelect: (hit: SearchHit) => void
}

export function ZineSearch({
  issue,
  query,
  hits,
  onQuery,
  onClose,
  onSelect,
}: ZineSearchProps) {
  const t = useTranslations('zines')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    input.current?.focus()
  }, [])
  const pages = [...new Set(hits.map((hit) => hit.page))]
  return (
    <aside className="zine-search" aria-label={t('search')}>
      <div className="zine-panel-heading">
        <h2>{t('searchIssue')}</h2>
        <button
          type="button"
          className="cursor-pointer"
          onClick={onClose}
          aria-label={t('closeSearch')}
        >
          <XIcon />
        </button>
      </div>
      <label className="zine-search-input">
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
      </label>
      <p className="zine-search-summary" role="status">
        {query.trim()
          ? t('results', { count: hits.length, pages: pages.length })
          : t('searchHint')}
      </p>
      <div className="zine-search-results">
        {pages.map((page) => (
          <section key={page}>
            <h3>
              {t('page', { page: String(page).padStart(2, '0') })}{' '}
              <span>
                {t('matches', {
                  count: hits.filter((hit) => hit.page === page).length,
                })}
              </span>
            </h3>
            <h4>{articleTitle(issue, page)}</h4>
            {hits
              .filter((hit) => hit.page === page)
              .map((hit) => (
                <button
                  type="button"
                  key={`${hit.start}-${hit.before.length}`}
                  className="cursor-pointer"
                  onClick={() => onSelect(hit)}
                >
                  {hit.before}
                  <mark>{hit.match}</mark>
                  {hit.after}
                </button>
              ))}
          </section>
        ))}
      </div>
    </aside>
  )
}
