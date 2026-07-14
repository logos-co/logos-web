'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { SearchIcon, XIcon } from '@acid-info/logos-ui'

import { ROUTES } from '@/constants/routes'
import {
  searchMediaEntries,
  type MediaSearchEntry,
  type MediaSearchType,
} from '@/lib/media-search'
import { Link } from '@/i18n/navigation'

import { SearchResultList } from './search-result-list'

interface MediaSearchSectionProps {
  entries: readonly MediaSearchEntry[]
  locale: string
}

type SearchTypeFilter = 'all' | MediaSearchType

const PAGE_SIZE = 12

const searchTypeFromParam = (value: string | null): SearchTypeFilter =>
  value === 'article' || value === 'podcast' ? value : 'all'

export function MediaSearchSection({
  entries,
  locale,
}: MediaSearchSectionProps) {
  const t = useTranslations('mediaSearch')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const selectedType = searchTypeFromParam(searchParams.get('type'))
  const [draft, setDraft] = useState(query)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const selectedTypes = useMemo<MediaSearchType[]>(
    () => (selectedType === 'all' ? ['article', 'podcast'] : [selectedType]),
    [selectedType]
  )
  const results = useMemo(
    () => searchMediaEntries(entries, query, { types: selectedTypes }),
    [entries, query, selectedTypes]
  )
  const visibleResults = results.slice(0, visibleCount)

  useEffect(() => {
    setDraft(query)
    setVisibleCount(PAGE_SIZE)
  }, [query, selectedType])

  const updateUrl = (nextQuery: string, nextType: SearchTypeFilter) => {
    const params = new URLSearchParams()
    if (nextQuery) params.set('q', nextQuery)
    if (nextType !== 'all') params.set('type', nextType)
    const nextSearch = params.toString()
    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, {
      scroll: false,
    })
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateUrl(draft.trim(), selectedType)
  }

  const clearSearch = () => {
    setDraft('')
    updateUrl('', selectedType)
  }

  const filters: Array<{ label: string; value: SearchTypeFilter }> = [
    { label: t('all'), value: 'all' },
    { label: t('articles'), value: 'article' },
    { label: t('podcasts'), value: 'podcast' },
  ]

  return (
    <section className="min-h-[70vh] bg-accent-tan px-3 pb-24 text-brand-dark-green md:px-6 lg:px-3">
      <div className="mx-auto w-full max-w-[1416px]">
        <div className="grid gap-8 border-b border-brand-dark-green pb-10 pt-10 md:grid-cols-12 md:pt-16">
          <div className="md:col-span-4">
            <Link
              href={ROUTES.media}
              className="font-mono text-[10px] leading-[1.3] font-medium uppercase underline underline-offset-4 cursor-pointer transition-opacity hover:opacity-65"
            >
              {t('backToMedia')}
            </Link>
          </div>
          <div className="flex flex-col gap-4 md:col-span-8">
            <span className="font-mono text-[10px] leading-[1.3] font-medium uppercase">
              {t('eyebrow')}
            </span>
            <h1 className="font-display text-[72px] leading-[0.84] tracking-[-0.05em] md:text-[112px] lg:text-[144px]">
              {t('title')}
            </h1>
            <p className="max-w-[480px] font-sans text-[16px] leading-[1.45]">
              {t('intro')}
            </p>
          </div>
        </div>

        <form
          role="search"
          onSubmit={submitSearch}
          className="flex items-center border-b border-brand-dark-green"
        >
          <label htmlFor="media-search-input" className="sr-only">
            {t('searchLabel')}
          </label>
          <input
            id="media-search-input"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('placeholder')}
            className="min-w-0 flex-1 bg-transparent py-6 font-display text-[32px] leading-none tracking-[-0.03em] outline-none placeholder:text-brand-dark-green/45 md:py-8 md:text-[54px]"
          />
          {draft ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label={t('clear')}
              className="inline-flex size-10 cursor-pointer items-center justify-center transition-opacity hover:opacity-60"
            >
              <XIcon size={15} />
            </button>
          ) : null}
          <button
            type="submit"
            aria-label={t('submit')}
            className="inline-flex size-12 cursor-pointer items-center justify-center border-l border-brand-dark-green transition-colors hover:bg-brand-dark-green hover:text-brand-off-white md:size-16"
          >
            <SearchIcon size={18} />
          </button>
        </form>

        <div className="flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
          <div
            className="font-mono text-[10px] leading-[1.3] font-medium uppercase"
            aria-live="polite"
          >
            {query ? t('results', { count: results.length }) : t('latest')}
          </div>
          <div className="flex flex-wrap gap-2" aria-label={t('searchLabel')}>
            {filters.map((filter) => {
              const active = selectedType === filter.value
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateUrl(draft.trim(), filter.value)}
                  className={`cursor-pointer border border-brand-dark-green px-3 py-2 font-mono text-[10px] leading-none font-medium uppercase transition-colors ${
                    active
                      ? 'bg-brand-dark-green text-brand-off-white'
                      : 'hover:bg-brand-dark-green hover:text-brand-off-white'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        {results.length > 0 ? (
          <>
            <SearchResultList entries={visibleResults} locale={locale} />
            {visibleResults.length < results.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="mt-8 h-12 w-full cursor-pointer border border-brand-dark-green font-mono text-[10px] font-medium uppercase transition-colors hover:bg-brand-dark-green hover:text-brand-off-white"
              >
                {t('loadMore')}
              </button>
            ) : null}
          </>
        ) : (
          <div className="border-t border-brand-dark-green py-16 md:grid md:grid-cols-12">
            <div className="flex flex-col gap-3 md:col-span-6 md:col-start-4">
              <h2 className="font-display text-[40px] leading-none tracking-[-0.03em]">
                {t('noResultsTitle')}
              </h2>
              <p className="font-sans text-[16px] leading-[1.45]">
                {t('noResultsBody')}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
