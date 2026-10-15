import { useEffect, useRef, type CSSProperties } from 'react'
import { Button } from '@acid-info/logos-ui'
import type { ZineIssue } from '@repo/content/schemas'
import { useTranslations } from 'next-intl'
import {
  visiblePages,
  type SearchHit,
  type ReaderView,
} from '@/lib/zines/reader-state'
interface ZineNavigationProps {
  issue: ZineIssue
  page: number
  numbers: number[]
  hits: SearchHit[]
  searching: boolean
  label: (page: number) => string
  selectPage: (page: number) => void
  showView: (view: ReaderView) => void
}
export function ZineNavigation({
  issue,
  page,
  numbers,
  hits,
  searching,
  label,
  selectPage,
  showView,
}: ZineNavigationProps) {
  const t = useTranslations('zines')
  const activeThumb = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    activeThumb.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [page])
  return (
    <>
      <div className="zine-filmstrip zine-desktop">
        <div className="zine-thumbnails">
          {Array.from({ length: issue.pageCount }, (_, number) => number)
            .filter(
              (number) =>
                number === 0 ||
                number === issue.pageCount - 1 ||
                number % 2 === 1
            )
            .map((first) => (
              <div
                key={first}
                className="zine-thumb-group"
                data-active={numbers.length === 2 && numbers.includes(first)}
              >
                {visiblePages(first, issue.pageCount, true).map((number) => {
                  const count = hits.filter((hit) => hit.page === number).length
                  return (
                    <button
                      type="button"
                      ref={number === page ? activeThumb : undefined}
                      key={number}
                      className="cursor-pointer"
                      aria-label={
                        count
                          ? `${label(number)} · ${t('matches', { count })}`
                          : label(number)
                      }
                      aria-current={
                        numbers.includes(number) ? 'page' : undefined
                      }
                      data-active={
                        numbers.length === 1 && numbers.includes(number)
                      }
                      data-hit={count > 0}
                      onClick={() => selectPage(number)}
                    >
                      <img
                        src={`/zines/generated/${issue.slug}/${number}-thumb.webp`}
                        alt=""
                        width={37}
                        height={52}
                        loading="lazy"
                      />
                    </button>
                  )
                })}
              </div>
            ))}
        </div>
        <p className="zine-page-status" role="status">
          {numbers.length === 2
            ? t('spreadStatus', {
                first: String(numbers[0]).padStart(2, '0'),
                last: String(numbers[1]).padStart(2, '0'),
                count: issue.pageCount - 2,
              })
            : label(page)}
          {searching &&
            ` · ${t(numbers.length === 2 ? 'spreadHits' : 'pageHits', {
              count: hits.filter((hit) => numbers.includes(hit.page)).length,
            })}`}
        </p>
      </div>
      <div className="zine-mobile zine-mobile-controls">
        <input
          className="cursor-pointer"
          type="range"
          style={
            {
              '--zine-progress': `${(page / (issue.pageCount - 1)) * 100}%`,
            } as CSSProperties
          }
          aria-valuetext={label(page)}
          min={0}
          max={issue.pageCount - 1}
          value={page}
          onChange={(event) => selectPage(Number(event.target.value))}
          aria-label={t('goToPage')}
        />
        <p className="zine-page-status" role="status">
          {page > 0 && page < issue.pageCount - 1
            ? t('pageStatus', {
                page: String(page).padStart(2, '0'),
                count: issue.pageCount - 2,
              })
            : label(page)}
        </p>
      </div>
      <div className="zine-mobile zine-guided-entry">
        <Button
          icon={false}
          className="cursor-pointer bg-brand-off-white text-brand-dark-green hover:bg-gray-01"
          onClick={() => showView('guided')}
        >
          {t('guidedButton')}
        </Button>
        <p>{t('guidedHint')}</p>
      </div>
    </>
  )
}
