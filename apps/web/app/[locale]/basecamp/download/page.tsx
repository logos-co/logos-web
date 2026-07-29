import type { Metadata } from 'next'

import { EXTERNAL_URLS } from '@/constants/routes'

import BasecampDownloadRedirect from './basecamp-download-redirect'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function BasecampDownloadPage() {
  return (
    <>
      <BasecampDownloadRedirect />
      <noscript>
        <meta
          httpEquiv="refresh"
          content={`0; url=${EXTERNAL_URLS.basecampRelease}`}
        />
      </noscript>
    </>
  )
}
