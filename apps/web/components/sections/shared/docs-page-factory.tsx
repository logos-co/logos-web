/**
 * Builds the `generateMetadata` + default page export for a docs-style legal
 * page (security, privacy-policy, terms-and-conditions). Each of those pages
 * is identical apart from its translation namespace, route path, and TOC key,
 * so this factory eliminates the ~40-line boilerplate per page.
 *
 * Usage:
 *   const { generateMetadata, Page } = createDocsPage({
 *     namespace: 'pages.security',
 *     path: ROUTES.security,
 *     activeKey: 'security',
 *   })
 *   export { generateMetadata }
 *   export default Page
 */
import { getTranslations } from 'next-intl/server'

import { createDefaultMetadata } from '@/utils/metadata'

import { DocsPageShell } from './docs-page-shell'
import type { DocsTocKey } from './docs-toc'

type RouteParams = { params: Promise<{ locale: string }> }

type DocsPageConfig = {
  /** next-intl message namespace, e.g. `pages.security`. Must contain
   * `title`, `description`, `heading`, `body` keys. */
  namespace: string
  /** Canonical route path from `ROUTES` — used for SEO metadata. */
  path: string
  /** Sidebar TOC entry to highlight as active. */
  activeKey: DocsTocKey
}

export function createDocsPage({ namespace, path, activeKey }: DocsPageConfig) {
  async function generateMetadata({ params }: RouteParams) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace })
    return createDefaultMetadata({
      title: t('title'),
      description: t('description'),
      locale,
      path,
    })
  }

  async function Page({ params }: RouteParams) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace })

    return (
      <DocsPageShell activeKey={activeKey}>
        <h1 className="text-eyebrow w-full text-brand-dark-green">
          {t('heading')}
        </h1>
        <div className="text-mono-s w-full whitespace-pre-line text-brand-dark-green">
          {t('body')}
        </div>
      </DocsPageShell>
    )
  }

  return { generateMetadata, Page }
}
