import type { Metadata } from 'next'

import { StaticRedirect } from '@/components/seo/static-redirect'
import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogPodcastPaths } from '@/lib/blog-content'
import { absoluteUrl } from '@/lib/metadata'

export const dynamicParams = false

export async function generateStaticParams() {
  const paths = await getBlogPodcastPaths()
  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({ locale, ...path }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ showSlug: string; slug: string }>
}): Promise<Metadata> {
  const { showSlug, slug } = await params
  return {
    robots: { index: false, follow: true },
    alternates: { canonical: absoluteUrl(ROUTES.mediaPodcast(showSlug, slug)) },
  }
}

export default async function LegacyPodcastPage({
  params,
}: {
  params: Promise<{ showSlug: string; slug: string }>
}) {
  const { showSlug, slug } = await params
  return (
    <StaticRedirect target={absoluteUrl(ROUTES.mediaPodcast(showSlug, slug))} />
  )
}
