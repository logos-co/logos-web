/**
 * Numbered pagination: `← 1 2 3 →`
 *
 * Used on /builders-hub/ideas and /builders-hub/rfps. Supports either
 * href-builder (SSR-friendly) or onChange (client-side).
 */
import type { ReactNode } from 'react'

type BaseProps = {
  currentPage: number
  totalPages: number
  /** Max page links to show before using ellipsis. Default 5. */
  maxVisible?: number
  className?: string
}

type HrefProps = BaseProps & {
  /** Build the href for a given page number. */
  getHref: (page: number) => string
  onChange?: never
}

type ClickProps = BaseProps & {
  onChange: (page: number) => void
  getHref?: never
}

export type PaginationProps = HrefProps | ClickProps

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      className="size-[14px] shrink-0 stroke-current"
      fill="none"
      viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
    >
      {direction === 'left' ? (
        <path d="M10.5 7H3.5M3.5 7L7 3.5M3.5 7L7 10.5" strokeLinecap="square" />
      ) : (
        <path
          d="M3.5 7H10.5M10.5 7L7 3.5M10.5 7L7 10.5"
          strokeLinecap="square"
        />
      )}
    </svg>
  )
}

/** Compute the set of pages / ellipses to render. */
function getPageItems(
  current: number,
  total: number,
  maxVisible: number
): (number | 'ellipsis')[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const items: (number | 'ellipsis')[] = []
  const side = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - side)
  const end = Math.min(total, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)

  if (start > 1) {
    items.push(1)
    if (start > 2) items.push('ellipsis')
  }
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total) {
    if (end < total - 1) items.push('ellipsis')
    items.push(total)
  }
  return items
}

export function Pagination(props: PaginationProps) {
  const { currentPage, totalPages, maxVisible = 5, className } = props
  if (totalPages <= 1) return null

  const items = getPageItems(currentPage, totalPages, maxVisible)

  const renderControl = (
    page: number,
    label: ReactNode,
    isActive: boolean,
    ariaLabel?: string
  ) => {
    const className_ = `inline-flex size-8 items-center justify-center text-body-sans transition-opacity ${
      isActive
        ? 'font-semibold text-brand-dark-green'
        : 'text-brand-dark-green/60 hover:text-brand-dark-green'
    }`
    if ('getHref' in props && props.getHref) {
      return (
        <a
          href={props.getHref(page)}
          aria-label={ariaLabel}
          aria-current={isActive ? 'page' : undefined}
          className={className_}
        >
          {label}
        </a>
      )
    }
    return (
      <button
        type="button"
        onClick={() => 'onChange' in props && props.onChange?.(page)}
        aria-label={ariaLabel}
        aria-current={isActive ? 'page' : undefined}
        className={className_}
      >
        {label}
      </button>
    )
  }

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-wrap items-center justify-center gap-2 ${className ?? ''}`}
    >
      {currentPage > 1 ? (
        renderControl(
          currentPage - 1,
          <Arrow direction="left" />,
          false,
          'Previous page'
        )
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex size-8 items-center justify-center text-brand-dark-green/30"
        >
          <Arrow direction="left" />
        </span>
      )}

      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span
            key={`e${i}`}
            aria-hidden="true"
            className="text-body-sans text-brand-dark-green/40"
          >
            …
          </span>
        ) : (
          <span key={item}>
            {renderControl(item, item, item === currentPage, `Page ${item}`)}
          </span>
        )
      )}

      {currentPage < totalPages ? (
        renderControl(
          currentPage + 1,
          <Arrow direction="right" />,
          false,
          'Next page'
        )
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex size-8 items-center justify-center text-brand-dark-green/30"
        >
          <Arrow direction="right" />
        </span>
      )}
    </nav>
  )
}
