/**
 * Shared presentational helpers for the circles section pages
 * (`circles-page.tsx`, `circle-detail-page.tsx`).
 *
 * `formatHostList` is intentionally NOT shared here — the listing page and the
 * detail page format host lists with different grammar (plain comma-join vs.
 * Oxford-style "& last") so each owns its own version.
 */
import type { ComponentProps, ReactNode } from 'react'

import { Link } from '@/i18n/navigation'

export type SmartLinkProps = ComponentProps<'a'> & {
  href: string
  children: ReactNode
}

/** True for absolute http(s) URLs — used to choose `<a>` vs locale-aware `<Link>`. */
export const isExternalHref = (href: string) => /^https?:\/\//.test(href)

/**
 * Renders an `<a>` for external URLs and a locale-aware `<Link>` for internal
 * routes, transparently forwarding all anchor-element props.
 */
export function SmartLink({ href, children, ...props }: SmartLinkProps) {
  if (isExternalHref(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

/**
 * 15px arrow rendered via CSS mask so it inherits the parent's `text-*` color.
 * Defaults to a right-pointing arrow.
 */
export function ArrowIcon({
  direction = 'right',
}: {
  direction?: 'left' | 'right'
}) {
  const url =
    direction === 'left' ? '/icons/arrow-left.svg' : '/icons/right-arrow.svg'
  return (
    <span
      aria-hidden="true"
      className="size-[15px] shrink-0 bg-current"
      style={{
        mask: `url(${url}) center / contain no-repeat`,
        WebkitMask: `url(${url}) center / contain no-repeat`,
      }}
    />
  )
}
