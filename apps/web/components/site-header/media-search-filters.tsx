'use client'

import { useTranslations } from 'next-intl'

import type { BlogSearchContentType } from '@/lib/blog-search-api'

export type MediaSearchActiveFilter = 'type' | 'topic' | null

export const DEFAULT_MEDIA_SEARCH_TYPES: BlogSearchContentType[] = [
  'article',
  'podcast',
]

interface MediaSearchFiltersProps {
  topics: readonly string[]
  selectedTypes: readonly BlogSearchContentType[]
  selectedTopics: readonly string[]
  activeFilter: MediaSearchActiveFilter
  onActiveFilterChange: (filter: MediaSearchActiveFilter) => void
  onTypeToggle: (type: BlogSearchContentType) => void
  onTopicToggle: (topic: string) => void
  onClear: () => void
}

const humaniseTopic = (topic: string) => topic.replaceAll('_', ' ')

export function MediaSearchFilters({
  topics,
  selectedTypes,
  selectedTopics,
  activeFilter,
  onActiveFilterChange,
  onTypeToggle,
  onTopicToggle,
  onClear,
}: MediaSearchFiltersProps) {
  const t = useTranslations('mediaSearch')
  const hasActiveFilters =
    selectedTypes.length !== DEFAULT_MEDIA_SEARCH_TYPES.length ||
    !DEFAULT_MEDIA_SEARCH_TYPES.every((type) => selectedTypes.includes(type)) ||
    selectedTopics.length > 0
  const typeFilterLabel =
    selectedTypes.length === 2
      ? `${t('articles')}, ${t('podcasts')}`
      : selectedTypes[0] === 'article'
        ? t('articles')
        : t('podcasts')
  const topicFilterLabel =
    selectedTopics.length === 0
      ? t('topics')
      : selectedTopics.length === 1
        ? humaniseTopic(selectedTopics[0])
        : t('selectedTopics', { count: selectedTopics.length })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <button
          type="button"
          aria-expanded={activeFilter === 'type'}
          onClick={() =>
            onActiveFilterChange(activeFilter === 'type' ? null : 'type')
          }
          className="min-w-[160px] cursor-pointer border border-brand-dark-green px-3 py-2 text-left font-sans text-[13px] transition-colors hover:bg-brand-dark-green hover:text-brand-off-white"
        >
          {typeFilterLabel}
        </button>
        {activeFilter === 'type' ? (
          <div className="absolute top-full right-0 z-10 mt-1 w-full border border-brand-dark-green bg-accent-tan p-2 shadow-lg">
            {DEFAULT_MEDIA_SEARCH_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onTypeToggle(type)}
                className="flex w-full cursor-pointer items-center gap-2 px-2 py-2 text-left font-sans text-[13px] hover:bg-brand-dark-green hover:text-brand-off-white"
              >
                <span
                  className={`size-3 border border-current ${
                    selectedTypes.includes(type) ? 'bg-current' : ''
                  }`}
                />
                {type === 'article' ? t('articles') : t('podcasts')}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-expanded={activeFilter === 'topic'}
          onClick={() =>
            onActiveFilterChange(activeFilter === 'topic' ? null : 'topic')
          }
          className="min-w-[160px] cursor-pointer border border-brand-dark-green px-3 py-2 text-left font-sans text-[13px] transition-colors hover:bg-brand-dark-green hover:text-brand-off-white"
        >
          {topicFilterLabel}
        </button>
        {activeFilter === 'topic' ? (
          <div className="absolute top-full right-0 z-10 mt-1 max-h-[240px] w-[240px] overflow-y-auto border border-brand-dark-green bg-accent-tan p-2 shadow-lg">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => onTopicToggle(topic)}
                className="flex w-full cursor-pointer items-center gap-2 px-2 py-2 text-left font-sans text-[13px] hover:bg-brand-dark-green hover:text-brand-off-white"
              >
                <span
                  className={`size-3 shrink-0 border border-current ${
                    selectedTopics.includes(topic) ? 'bg-current' : ''
                  }`}
                />
                {humaniseTopic(topic)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="h-11 cursor-pointer px-2 font-mono text-[10px] font-medium uppercase underline underline-offset-2 transition-opacity hover:opacity-60"
        >
          {t('clearFilters')}
        </button>
      ) : null}
    </div>
  )
}
