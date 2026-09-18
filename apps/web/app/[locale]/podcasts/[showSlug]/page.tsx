import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogPodcastShowSlugs } from '@/lib/blog-content'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.mediaPodcastsSection

export const dynamicParams = false

export async function generateStaticParams() {
  const showSlugs = await getBlogPodcastShowSlugs()
  return routing.locales.flatMap((locale) =>
    showSlugs.map((showSlug) => ({ locale, showSlug }))
  )
}

export const generateMetadata = createRedirectMetadata(TARGET)

export default async function LegacyPodcastShowPage({
  params,
}: {
  params: Promise<{ locale: string; showSlug: string }>
}) {
  const { locale } = await params
  return <StaticRedirect target={TARGET} locale={locale} />
}
