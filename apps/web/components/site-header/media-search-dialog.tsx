'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { SearchIcon, XIcon } from '@acid-info/logos-ui'

import {
  BLOG_SEARCH_PAGE_SIZE,
  searchBlog,
  type BlogSearchContentType,
  type BlogSearchPost,
} from '@/lib/blog-search-api'

import {
  DEFAULT_MEDIA_SEARCH_TYPES,
  MediaSearchFilters,
  type MediaSearchActiveFilter,
} from './media-search-filters'
import { MediaSearchResults } from './media-search-results'

interface MediaSearchDialogProps {
  isOpen: boolean
  locale: string
  topics: readonly string[]
  onClose: () => void
}

const mergeUniquePosts = (
  current: readonly BlogSearchPost[],
  incoming: readonly BlogSearchPost[]
) => [
  ...new Map(
    [...current, ...incoming].map((post) => [post.href, post] as const)
  ).values(),
]

export function MediaSearchDialog({
  isOpen,
  locale,
  topics,
  onClose,
}: MediaSearchDialogProps) {
  const t = useTranslations('mediaSearch')
  const requestController = useRef<AbortController | null>(null)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<BlogSearchContentType[]>(
    DEFAULT_MEDIA_SEARCH_TYPES
  )
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [activeFilter, setActiveFilter] =
    useState<MediaSearchActiveFilter>(null)
  const [posts, setPosts] = useState<BlogSearchPost[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      requestController.current?.abort()
      setDraft('')
      setQuery('')
      setSelectedTypes(DEFAULT_MEDIA_SEARCH_TYPES)
      setSelectedTopics([])
      setActiveFilter(null)
      setPosts([])
      setTotal(0)
      setHasMore(false)
      setIsLoading(false)
      setHasError(false)
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const runSearch = async (
    nextQuery: string,
    nextTypes: readonly BlogSearchContentType[],
    nextTopics: readonly string[],
    skip = 0
  ) => {
    const trimmedQuery = nextQuery.trim()
    if (!trimmedQuery) {
      setQuery('')
      setPosts([])
      setTotal(0)
      setHasMore(false)
      return
    }

    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    setIsLoading(true)
    setHasError(false)
    setQuery(trimmedQuery)
    if (skip === 0) setPosts([])

    try {
      const result = await searchBlog(
        {
          query: trimmedQuery,
          tags: nextTopics,
          types: nextTypes,
          limit: BLOG_SEARCH_PAGE_SIZE,
          skip,
        },
        controller.signal
      )

      setPosts((current) =>
        skip === 0 ? result.posts : mergeUniquePosts(current, result.posts)
      )
      setTotal(result.total)
      setHasMore(result.hasMore)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setHasError(true)
      if (skip === 0) setPosts([])
    } finally {
      if (requestController.current === controller) setIsLoading(false)
    }
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveFilter(null)
    void runSearch(draft, selectedTypes, selectedTopics)
  }

  const toggleType = (type: BlogSearchContentType) => {
    const nextTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((selectedType) => selectedType !== type)
      : [...selectedTypes, type]
    if (nextTypes.length === 0) return

    setSelectedTypes(nextTypes)
    if (query) void runSearch(query, nextTypes, selectedTopics)
  }

  const toggleTopic = (topic: string) => {
    const nextTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter((selectedTopic) => selectedTopic !== topic)
      : [...selectedTopics, topic]

    setSelectedTopics(nextTopics)
    if (query) void runSearch(query, selectedTypes, nextTopics)
  }

  const clearSearch = () => {
    requestController.current?.abort()
    setDraft('')
    setQuery('')
    setPosts([])
    setTotal(0)
    setHasMore(false)
    setHasError(false)
  }

  const clearFilters = () => {
    setSelectedTypes(DEFAULT_MEDIA_SEARCH_TYPES)
    setSelectedTopics([])
    setActiveFilter(null)
    if (query) void runSearch(query, DEFAULT_MEDIA_SEARCH_TYPES, [])
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex cursor-pointer items-start justify-center overflow-hidden bg-brand-dark-green/60 p-3 pt-12 md:p-6 md:pt-16"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        id="media-search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('searchLabel')}
        className="flex max-h-[calc(100dvh-60px)] w-full max-w-[1120px] cursor-default flex-col border border-brand-dark-green bg-accent-tan text-brand-dark-green shadow-2xl md:max-h-[calc(100dvh-96px)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-brand-dark-green px-4 py-3 md:px-6">
          <span className="font-mono text-[10px] leading-[1.3] font-medium uppercase">
            {t('searchLabel')}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="inline-flex size-8 cursor-pointer items-center justify-center border border-brand-dark-green transition-colors hover:bg-brand-dark-green hover:text-brand-off-white"
          >
            <XIcon size={13} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 md:px-6">
          <form
            role="search"
            onSubmit={submitSearch}
            className="flex items-center border-b border-brand-dark-green"
          >
            <label htmlFor="media-search-dialog-input" className="sr-only">
              {t('searchLabel')}
            </label>
            <input
              id="media-search-dialog-input"
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('placeholder')}
              className="min-w-0 flex-1 bg-transparent py-5 font-display text-[28px] leading-none tracking-[-0.03em] outline-none placeholder:text-brand-dark-green/45 md:text-[40px]"
            />
            {draft ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label={t('clear')}
                className="inline-flex size-10 cursor-pointer items-center justify-center transition-opacity hover:opacity-60"
              >
                <XIcon size={13} />
              </button>
            ) : null}
            <button
              type="submit"
              aria-label={t('submit')}
              className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center border-l border-brand-dark-green transition-colors hover:bg-brand-dark-green hover:text-brand-off-white md:size-16"
            >
              <SearchIcon size={18} />
            </button>
          </form>

          {query ? (
            <>
              <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                <div
                  className="font-mono text-[10px] leading-[1.3] font-medium uppercase"
                  aria-live="polite"
                >
                  {isLoading && posts.length === 0
                    ? t('loading')
                    : t('results', { count: total })}
                </div>

                <MediaSearchFilters
                  topics={topics}
                  selectedTypes={selectedTypes}
                  selectedTopics={selectedTopics}
                  activeFilter={activeFilter}
                  onActiveFilterChange={setActiveFilter}
                  onTypeToggle={toggleType}
                  onTopicToggle={toggleTopic}
                  onClear={clearFilters}
                />
              </div>

              {hasError ? (
                <div className="border-t border-brand-dark-green py-12 text-center font-sans text-[15px]">
                  {t('loadError')}
                </div>
              ) : posts.length > 0 ? (
                <>
                  <MediaSearchResults
                    posts={posts}
                    locale={locale}
                    onResultClick={onClose}
                  />
                  {hasMore ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        void runSearch(
                          query,
                          selectedTypes,
                          selectedTopics,
                          posts.length
                        )
                      }
                      className="mt-6 h-11 w-full cursor-pointer border border-brand-dark-green font-mono text-[10px] font-medium uppercase transition-colors hover:bg-brand-dark-green hover:text-brand-off-white disabled:cursor-wait disabled:opacity-50"
                    >
                      {isLoading ? t('loading') : t('loadMore')}
                    </button>
                  ) : null}
                </>
              ) : !isLoading ? (
                <div className="border-t border-brand-dark-green py-12 text-center">
                  <h2 className="font-display text-[30px] leading-none tracking-[-0.03em]">
                    {t('noResultsTitle')}
                  </h2>
                  <p className="mt-3 font-sans text-[14px] leading-[1.45]">
                    {t('noResultsBody')}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}
