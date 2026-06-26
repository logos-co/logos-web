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
 *   - text-mono-s (Fira Mono Regular 10px) for inactive items
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
  { key: 'testnetFaqs', href: ROUTES.testnetV01Faqs },
  { key: 'testnetTerms', href: ROUTES.testnetTermsAndConditions },
]

interface DocsTocProps {
  activeKey: DocsTocKey
}

export async function DocsToc({ activeKey }: DocsTocProps) {
  const t = await getTranslations('common.docsNav')

  return (
    <nav
      aria-label="Docs navigation"
      className="flex w-56.5 shrink-0 flex-col items-start gap-1 self-start py-20 xl:sticky xl:top-0"
    >
      {ITEMS.map((item) => {
        const isActive = item.key === activeKey

        if (isActive) {
          return (
            <span
              key={item.key}
              aria-current="page"
              className="flex items-center gap-1"
            >
              <span
                aria-hidden="true"
                className="h-2 w-3 shrink-0 rounded-full bg-brand-dark-green"
              />
              <span className="text-eyebrow text-brand-dark-green">
                {t(item.key)}
              </span>
            </span>
          )
        }

        const className =
          'text-mono-s cursor-pointer text-brand-dark-green transition-opacity hover:opacity-60'

        return (
          <Link key={item.key} href={item.href} className={className}>
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )
}
