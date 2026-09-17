import { getTranslations } from 'next-intl/server'

import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

/**
 * Shared left-side ToC used by FAQ, Terms, Privacy, Security
 * (and any future docs / legal pages that share the secondary nav).
 *
 * Figma desktop nodes: 40009046:22319 (FAQ frame),
 * mobile node:         40009046:22278 (FAQ frame).
 *
 * Layout matches Figma exactly:
 *   - w-[226px], py-20, gap-1 (4px in Figma)
 *   - text-mono-s (Fira Mono Regular 12px) for inactive items
 *   - dot (h-2 w-3 rounded-full) + text-eyebrow for the active item
 *   - sticky top-0 from xl upward (matches the gap-122 desktop frame)
 */

export type DocsTocKey =
  | 'designGuide'
  | 'terms'
  | 'privacy'
  | 'security'
  | 'faq'
  | 'testnetFaqs'
  | 'testnetTerms'

interface DocsTocItem {
  key: DocsTocKey
  href: string
}

const ITEMS: ReadonlyArray<DocsTocItem> = [
  { key: 'designGuide', href: ROUTES.designGuide },
  { key: 'terms', href: ROUTES.terms },
  { key: 'privacy', href: ROUTES.privacy },
  { key: 'security', href: ROUTES.security },
  { key: 'testnetFaqs', href: ROUTES.testnetFaqs },
  { key: 'testnetTerms', href: ROUTES.testnetTermsAndConditions },
]

export interface DocsNavItem {
  label: string
  href: string
}

interface DocsNavProps {
  /** Accessible name of the navigation landmark. */
  label: string
  items: readonly DocsNavItem[]
  /** `href` of the item for the current page. */
  activeHref?: string
}

/** The docs side navigation, for any set of sibling documents. */
export function DocsNav({ label, items, activeHref }: DocsNavProps) {
  return (
    <nav
      aria-label={label}
      className="flex w-56.5 shrink-0 flex-col items-start gap-1 self-start py-20 xl:sticky xl:top-0"
    >
      {items.map((item) => {
        const isActive = item.href === activeHref

        if (isActive) {
          return (
            <span
              key={item.href}
              aria-current="page"
              className="flex items-center gap-1"
            >
              <span
                aria-hidden="true"
                className="h-2 w-3 shrink-0 rounded-full bg-brand-dark-green"
              />
              <span className="text-eyebrow text-brand-dark-green">
                {item.label}
              </span>
            </span>
          )
        }

        const className =
          'text-mono-s cursor-pointer text-brand-dark-green transition-opacity hover:opacity-60'

        return (
          <Link key={item.href} href={item.href} className={className}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

interface DocsTocProps {
  activeKey: DocsTocKey
}

/** The site-wide docs navigation shared by the legal and guide pages. */
export async function DocsToc({ activeKey }: DocsTocProps) {
  const t = await getTranslations('common.docsNav')
  const items = ITEMS.map(({ key, href }) => ({ label: t(key), href }))
  const activeHref = ITEMS.find(({ key }) => key === activeKey)?.href

  return (
    <DocsNav label="Docs navigation" items={items} activeHref={activeHref} />
  )
}
