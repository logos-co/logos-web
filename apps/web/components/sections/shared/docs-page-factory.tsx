/**
 * Builds the `generateMetadata` + default page export for a docs-style legal
 * page (security, privacy-policy, terms-and-conditions, testnet-v01-faqs).
 * Each of those pages is identical apart from its markdown source file, route
 * path, and TOC key, so this factory eliminates the boilerplate per page.
 *
 * Content lives in `content/legal/<slug>.md` and is loaded + validated by
 * `getLegalDoc`. The markdown frontmatter owns the page's SEO title,
 * description, and visible heading; the body is rendered with `LegalMarkdown`.
 *
 * Usage:
 *   const { generateMetadata, Page } = createDocsPage({
 *     slug: 'security',
 *     path: ROUTES.security,
 *     activeKey: 'security',
 *   })
 *   export { generateMetadata }
 *   export default Page
 */
import { getLegalDoc } from '@/lib/legal-content'
import { createDefaultMetadata } from '@/lib/metadata'

import { DocsPageShell } from './docs-page-shell'
import type { DocsTocKey } from './docs-toc'
import { LegalMarkdown } from './legal-markdown'

type RouteParams = { params: Promise<{ locale: string }> }

type DocsPageConfig = {
  /** Markdown source basename under `content/legal/`, e.g. `security`. */
  slug: string
  /** Canonical route path from `ROUTES` — used for SEO metadata. */
  path: string
  /** Sidebar TOC entry to highlight as active. */
  activeKey: DocsTocKey
}

export function createDocsPage({ slug, path, activeKey }: DocsPageConfig) {
  async function generateMetadata({ params }: RouteParams) {
    const { locale } = await params
    const { title, description } = getLegalDoc(slug)
    return createDefaultMetadata({ title, description, locale, path })
  }

  function Page() {
    const { heading, body } = getLegalDoc(slug)

    return (
      <DocsPageShell activeKey={activeKey}>
        <h1 className="text-eyebrow w-full text-brand-dark-green">{heading}</h1>
        <LegalMarkdown body={body} />
      </DocsPageShell>
    )
  }

  return { generateMetadata, Page }
}
