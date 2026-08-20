import type { Metadata } from 'next'

import { StaticRedirect } from '@/components/seo/static-redirect'
import { ROUTES } from '@/constants/routes'
import { absoluteUrl } from '@/lib/metadata'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl(ROUTES.media) },
}

export default function LegacySearchPage() {
  return <StaticRedirect target={absoluteUrl(ROUTES.media)} />
}
