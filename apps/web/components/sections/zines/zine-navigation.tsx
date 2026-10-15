import { useEffect, useRef } from 'react'
import { Button } from '@acid-info/logos-ui'
import type { ZineIssue } from '@repo/content/schemas'
import { useTranslations } from 'next-intl'
import type { ReaderView } from '@/lib/zines/reader-state'
interface ZineNavigationProps {
  issue: ZineIssue
  page: number
  numbers: number[]
  label: (page: number) => string
  selectPage: (page: number) => void
  showView: (view: ReaderView) => void
}
export function ZineNavigation({
  issue,
  page,
  numbers,
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
          {Array.from({ length: issue.pageCount }, (_, number) => ({
            number,
          })).map((item) => (
            <button
              type="button"
              ref={item.number === page ? activeThumb : undefined}
              key={item.number}
              className="cursor-pointer"
              aria-label={label(item.number)}
              aria-current={numbers.includes(item.number) ? 'page' : undefined}
              onClick={() => selectPage(item.number)}
            >
              <img
                src={`/zines/generated/${issue.slug}/${item.number}-thumb.webp`}
                alt=""
                width={37}
                height={52}
                loading="lazy"
              />
            </button>
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
        </p>
      </div>
      <div className="zine-mobile zine-mobile-controls">
        <input
          className="cursor-pointer"
          type="range"
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
