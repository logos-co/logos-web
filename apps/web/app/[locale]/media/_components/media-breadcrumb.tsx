import { Link } from '@/i18n/navigation'
import type { BreadcrumbItem } from '@/lib/structured-data'

interface MediaBreadcrumbProps {
  label: string
  /** Parent sections only; the page title is already the h1 below. */
  items: ReadonlyArray<BreadcrumbItem>
}

export function MediaBreadcrumb({ label, items }: MediaBreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label={label}
      className="font-sans text-[12px] leading-4 text-brand-dark-green"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            <Link
              href={item.path}
              className="cursor-pointer no-underline underline-offset-2 hover:underline"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
