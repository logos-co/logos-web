import type { Metadata } from 'next'

import { StaticRedirect } from '@/components/seo/static-redirect'
import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogPodcastShowSlugs } from '@/lib/blog-content'
import { absoluteUrl } from '@/lib/metadata'

export const dynamicParams = false

export async function generateStaticParams() {
  const showSlugs = await getBlogPodcastShowSlugs()
  return routing.locales.flatMap((locale) =>
    showSlugs.map((showSlug) => ({ locale, showSlug }))
  )
}

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl(ROUTES.mediaPodcastsSection) },
}

export default function LegacyPodcastShowPage() {
  return <StaticRedirect target={absoluteUrl(ROUTES.mediaPodcastsSection)} />
}
