import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogArticleSlugs } from '@/lib/blog-content'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await getBlogArticleSlugs()
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  return createRedirectMetadata(ROUTES.mediaArticle(slug))({ params })
}

export default async function LegacyArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  return <StaticRedirect target={ROUTES.mediaArticle(slug)} locale={locale} />
}
