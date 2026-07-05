import type { Metadata } from 'next'

import { ROUTES } from '@/constants/routes'
import { absoluteUrl } from '@/lib/metadata'

const TARGET = ROUTES.testnetFaqs

export const metadata: Metadata = {
  title: 'Redirecting...',
  robots: { index: false, follow: false },
  alternates: { canonical: absoluteUrl(TARGET) },
}

export default function TestnetV01FaqsPage() {
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
          Redirecting to <a href={TARGET}>{TARGET}</a>...
        </p>
      </noscript>
    </>
  )
}
