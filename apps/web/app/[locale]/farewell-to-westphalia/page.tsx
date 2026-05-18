import type { Metadata } from 'next'

import { ROUTES } from '@/constants/routes'
import { absoluteUrl } from '@/lib/metadata'

/**
 * Static-export-friendly redirect from /farewell-to-westphalia → /book.
 *
 * `next.config.mjs` runs in `output: 'export'` mode, so Next.js's
 * `redirects()` config and the `redirect()` helper from `next/navigation`
 * are unavailable at request time. Instead we ship a tiny static page
 * that triggers the redirect three ways:
 *   1. Inline `<script>` calls `location.replace(...)` immediately.
 *   2. `<meta http-equiv="refresh">` fires for users with JS disabled.
 *   3. `<noscript>` link as a final fallback.
 */

const TARGET = ROUTES.book

export const metadata: Metadata = {
  title: 'Redirecting…',
  robots: { index: false, follow: false },
  alternates: { canonical: absoluteUrl(TARGET) },
}

export default function FarewellToWestphaliaPage() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${TARGET}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(TARGET)})`,
        }}
      />
      <noscript>
        <p className="px-3 py-12 text-brand-dark-green">
          Redirecting to <a href={TARGET}>{TARGET}</a>…
        </p>
      </noscript>
    </>
  )
}
