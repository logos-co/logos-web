import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { isActiveLocale } from '@repo/content/locales'

import { JsonLd } from '@/components/seo/json-ld'
import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogArticleDetail, getBlogArticleSlugs } from '@/lib/blog-content'
import { withLocalMediaImages } from '@/lib/media-image-manifest'
import { absoluteUrl, createDefaultMetadata } from '@/lib/metadata'
import {
  createArticleJsonLd,
  createBreadcrumbListJsonLd,
} from '@/lib/structured-data'

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
    image: article.ogImage ?? article.coverImage,
    openGraphType: 'article',
    publishedTime: article.publishedAt,
    modifiedTime: article.modifiedAt,
    authors: article.authors.map((author) => author.name),
  })
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
    getTranslations('mediaDetail'),
  ])

  if (!article) notFound()

  const copy: ArticleDetailCopy = {
    breadcrumb: t('breadcrumbs.label'),
    contents: t('article.contents'),
    share: t('article.share'),
    copied: t('article.copied'),
    relatedArticles: t('article.relatedArticles'),
    fromSameAuthors: t('article.fromSameAuthors'),
    footnotes: t('article.footnotes'),
    minRead: t('article.minRead', { count: article.readingTime }),
  }
  const articlePath = ROUTES.mediaArticle(article.slug)
  const canonicalUrl = absoluteUrl(articlePath, locale)
  const parentCrumbs = [
    { name: t('breadcrumbs.media'), path: ROUTES.media },
    { name: t('breadcrumbs.articles'), path: ROUTES.mediaArticlesSection },
  ]

  return (
    <>
      <JsonLd
        data={createArticleJsonLd({
          path: articlePath,
          headline: article.title,
          description: article.summary,
          image: article.ogImage?.url ?? article.coverImage?.url,
          datePublished: article.publishedAt,
          dateModified: article.modifiedAt,
          authors: article.authors.map((author) => author.name),
        })}
      />
      <JsonLd
        data={createBreadcrumbListJsonLd(
          [...parentCrumbs, { name: article.title, path: articlePath }],
          locale
        )}
      />
      <ArticleDetailPage
        article={withLocalMediaImages(article)}
        breadcrumbs={parentCrumbs}
        copy={copy}
        canonicalUrl={canonicalUrl}
      />
    </>
  )
}
