import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { getBlogArticleDetail, getBlogArticleSlugs } from '@/lib/blog-content'
import { absoluteUrl, createDefaultMetadata } from '@/lib/metadata'
import { ORGANIZATION_FRAGMENT, SCHEMA_ORGANIZATION } from '@/lib/schema-org'

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
    publisher: {
      '@type': SCHEMA_ORGANIZATION,
      '@id': `${absoluteUrl('')}${ORGANIZATION_FRAGMENT}`,
      name: 'Logos',
      url: absoluteUrl(''),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.svg'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(ROUTES.mediaArticle(article.slug)),
    },
  }
}

function articleBreadcrumbJsonLd(
  article: { slug: string; title: string },
  labels: { media: string; articles: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: labels.media,
        item: absoluteUrl(ROUTES.media),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: labels.articles,
        item: absoluteUrl(ROUTES.mediaArticles),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: absoluteUrl(ROUTES.mediaArticle(article.slug)),
      },
    ],
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
    getTranslations('mediaDetail'),
  ])

  if (!article) notFound()

  const copy: ArticleDetailCopy = {
    contents: t('article.contents'),
    share: t('article.share'),
    copied: t('article.copied'),
    relatedArticles: t('article.relatedArticles'),
    fromSameAuthors: t('article.fromSameAuthors'),
    footnotes: t('article.footnotes'),
    minRead: t('article.minRead', { count: article.readingTime }),
    discussion: t('article.discussion'),
    discussionComments: t('article.comments', {
      count: article.discussion?.postsCount ?? 0,
    }),
    joinDiscussion: t('article.joinDiscussion'),
    noDiscussion: t('article.noDiscussion'),
    readFullArticle: t('article.readFullArticle'),
    startDiscussion: t('article.startDiscussion'),
    viewFullDiscussion: t('article.viewFullDiscussion'),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleBreadcrumbJsonLd(article, {
              media: t('breadcrumbs.media'),
              articles: t('breadcrumbs.articles'),
            })
          ),
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
