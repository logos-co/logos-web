import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogPodcastPaths } from '@/lib/blog-content'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

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
  params: Promise<{ locale: string; showSlug: string; slug: string }>
}) {
  const { showSlug, slug } = await params
  return createRedirectMetadata(ROUTES.mediaPodcast(showSlug, slug))({ params })
}

export default async function LegacyPodcastPage({
  params,
}: {
  params: Promise<{ locale: string; showSlug: string; slug: string }>
}) {
  const { locale, showSlug, slug } = await params
  return (
    <StaticRedirect
      target={ROUTES.mediaPodcast(showSlug, slug)}
      locale={locale}
    />
  )
}
