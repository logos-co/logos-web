import { notFound } from 'next/navigation'
import {
  getZineCatalogue,
  getZineIssue,
  getZineArticleBodies,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import { routing } from '@/i18n/routing'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'
import { ZineArticleView } from '@/components/sections/zines/zine-article-view'

interface PageProps {
  params: Promise<{ locale: string; slug: string; article: string }>
}
export const dynamicParams = false

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug: string; article: string }> = []
  for (const locale of routing.locales) {
    const catalogue = await getZineCatalogue(locale)
    for (const edition of catalogue.editions.filter((item) => item.reader)) {
      const issue = await getZineIssue(locale, edition.slug)
      params.push(
        ...(issue.articles ?? []).map((article) => ({
          locale,
          slug: issue.slug,
          article: article.slug,
        }))
      )
    }
  }
  return params
}

async function readArticle(params: PageProps['params']) {
  const { locale, slug, article: articleSlug } = await params
  if (!isActiveLocale(locale)) notFound()
  const issue = await getZineIssue(locale, slug)
  const article = issue.articles?.find((item) => item.slug === articleSlug)
  if (!article) notFound()
  return { locale, issue, article }
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, issue, article } = await readArticle(params)
  return createDefaultMetadata({
    title: article.title,
    description: issue.description,
    locale,
    path: ROUTES.zineArticle(issue.slug, article.slug),
  })
}

export default async function ZineArticlePage({ params }: PageProps) {
  const { locale, issue, article } = await readArticle(params)
  const bodies = await getZineArticleBodies(locale, issue.slug)
  return (
    <ZineArticleView
      issue={issue}
      article={article}
      body={bodies[article.slug]}
    />
  )
}
