/**
 * Static-export-friendly permanent redirect.
 *
 * `next.config.mjs` runs in `output: 'export'` mode, so neither the
 * `redirects()` config nor the `redirect()` helper from `next/navigation`
 * works: the first needs a server, the second builds an empty page that ships
 * as a bare HTTP 200 with no title, no canonical and no body. Instead we ship
 * a tiny static page that redirects three ways:
 *   1. Inline `<script>` calls `location.replace(...)` immediately.
 *   2. `<meta http-equiv="refresh">` fires for users with JS disabled.
 *   3. `<noscript>` link as a final fallback.
 *
 * These pages must never carry `noindex`. Google reads a zero-delay meta
 * refresh as a permanent redirect and forwards the source URL's ranking
 * signals to the canonical target, but `noindex` overrides that and drops the
 * source outright, stranding whatever it had earned. Search Console showed
 * both halves of this: `/farewell-to-westphalia` (noindex) was filed under
 * "Excluded by 'noindex' tag" while still drawing 20 clicks from 373
 * impressions at position 2.1, whereas `/circles` (no robots meta) was
 * correctly filed under "Page with redirect".
 *
 * Redirect sources stay out of `app/sitemap.ts` — a sitemap lists destinations.
 *
 * Both helpers take an explicit `locale`. Calling `getTranslations()` without
 * one makes next-intl reach for `headers()`, which turns the route dynamic and
 * fails the export with `couldn't be rendered statically`.
 */
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { absoluteUrl } from '@/lib/metadata'
import { env } from '@/lib/env'

type LocaleParams = { params: Promise<{ locale: string }> }

/**
 * Builds the `generateMetadata` export for a redirect stub: canonical points at
 * the destination so Google consolidates the two URLs, and indexing follows the
 * same production gate as `createDefaultMetadata` so staging never leaks.
 */
export function createRedirectMetadata(target: string) {
  return async function generateMetadata({
    params,
  }: LocaleParams): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'pages.redirect' })

    return {
      title: t('title'),
      alternates: { canonical: absoluteUrl(target) },
      robots: {
        index: env.NEXT_PUBLIC_API_MODE === 'production',
        follow: true,
      },
    }
  }
}

export async function StaticRedirect({
  target,
  locale,
}: {
  target: string
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: 'pages.redirect' })

  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(target)})`,
        }}
      />
      <noscript>
        <p className="px-3 py-12 text-brand-dark-green">
          <a
            href={target}
            className="cursor-pointer underline transition-opacity hover:opacity-70"
          >
            {t('fallback', { target })}
          </a>
        </p>
      </noscript>
    </>
  )
}
