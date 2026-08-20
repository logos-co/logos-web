import type { Metadata } from 'next'

import { isActiveLocale } from '@repo/content/locales'

import { StaticRedirect } from '@/components/seo/static-redirect'
import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogArticleSlugs } from '@/lib/blog-content'
import { absoluteUrl } from '@/lib/metadata'

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
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }
  return {
    robots: { index: false, follow: true },
    alternates: { canonical: absoluteUrl(ROUTES.mediaArticle(slug), locale) },
  }
}

export default async function LegacyArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  return (
    <StaticRedirect target={absoluteUrl(ROUTES.mediaArticle(slug), locale)} />
  )
}
