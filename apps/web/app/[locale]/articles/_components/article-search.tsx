'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { SearchIcon, XIcon } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import type { BlogArticleRow } from '@/lib/blog-engine'

import { ArticleEntry } from '../../media/_sections/articles'

interface ArticleSearchProps {
  articles: readonly BlogArticleRow[]
  children: ReactNode
}

export function ArticleSearch({ articles, children }: ArticleSearchProps) {
  const t = useTranslations('articleListing')
  const search = useTranslations('mediaSearch')
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const hasQuery = terms.length > 0
  const results = hasQuery
    ? articles.filter((article) => {
        const text = [article.title, article.description, article.author]
          .join(' ')
          .toLocaleLowerCase()
        return terms.every((term) => text.includes(term))
      })
    : articles

  return (
    <>
      <ContentWidth className="pb-6 pt-4 text-brand-dark-green">
        <form
          role="search"
          aria-label={t('searchPlaceholder')}
          onSubmit={(event) => event.preventDefault()}
          className="flex items-center gap-3 rounded-xl border border-brand-dark-green px-4 focus-within:ring-2 focus-within:ring-brand-dark-green"
        >
          <span aria-hidden="true" className="flex shrink-0">
            <SearchIcon size={18} />
          </span>
          <label htmlFor={inputId} className="sr-only">
            {t('searchPlaceholder')}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-describedby={`${inputId}-hint`}
            className="min-w-0 flex-1 bg-transparent py-4 font-sans text-base outline-none placeholder:text-brand-dark-green/60"
          />
          {query ? (
            <button
              type="button"
              aria-label={search('clear')}
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded transition-colors hover:bg-brand-dark-green/10 focus-visible:outline-2"
            >
              <XIcon size={13} />
            </button>
          ) : null}
        </form>
        <div className="mt-3 flex flex-wrap justify-between gap-2 font-mono text-xs">
          <p id={`${inputId}-hint`}>{t('searchHint')}</p>
          <p role="status" aria-live="polite" aria-atomic="true">
            {t('articleCount', { count: results.length })}
          </p>
        </div>
      </ContentWidth>
      {hasQuery ? (
        results.length > 0 ? (
          results.map((article, index) => (
            <ArticleEntry key={article.href} article={article} index={index} />
          ))
        ) : (
          <ContentWidth className="py-12 text-center text-brand-dark-green">
            <h3 className="font-display text-3xl">
              {search('noResultsTitle')}
            </h3>
            <p className="mt-3 font-sans text-sm">{t('noResultsBody')}</p>
          </ContentWidth>
        )
      ) : (
        children
      )}
    </>
  )
}
