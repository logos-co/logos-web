import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogArticleDetail, getBlogArticleSlugs } from '@/lib/blog-content'
import { absoluteUrl, createDefaultMetadata } from '@/lib/metadata'

import { ArticleDetailPage } from './_sections/article-detail-page'
import type { ArticleDetailCopy } from './_sections/types'

export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await getBlogArticleSlugs()
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({
      locale,
      slug,
    }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }

  const article = await getBlogArticleDetail(slug)
  return createDefaultMetadata({
    title: `${article.title} | Logos`,
    description: article.summary,
    locale,
    path: ROUTES.mediaArticle(article.slug),
    noindex: article.isDraft,
  })
}

function articleJsonLd(
  article: Awaited<ReturnType<typeof getBlogArticleDetail>>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt ?? article.publishedAt,
    image: article.ogImage?.url ?? article.coverImage?.url,
    author: article.authors.map((author) => ({
      '@type': 'Person',
      name: author.name,
    })),
    mainEntityOfPage: absoluteUrl(ROUTES.mediaArticle(article.slug)),
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`ArticlePage received non-active locale "${locale}"`)
  }

  const [article, t] = await Promise.all([
    getBlogArticleDetail(slug).catch(() => null),
    getTranslations('mediaDetail.article'),
  ])

  if (!article) notFound()

  const copy: ArticleDetailCopy = {
    contents: t('contents'),
    share: t('share'),
    copied: t('copied'),
    relatedArticles: t('relatedArticles'),
    fromSameAuthors: t('fromSameAuthors'),
    footnotes: t('footnotes'),
    minRead: t('minRead', { count: article.readingTime }),
  }
  const canonicalUrl = absoluteUrl(ROUTES.mediaArticle(article.slug), locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(article)),
        }}
      />
      <ArticleDetailPage
        article={article}
        copy={copy}
        canonicalUrl={canonicalUrl}
      />
    </>
  )
}
