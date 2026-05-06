import { getTranslations } from 'next-intl/server'
import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { getPressPageData, repeatToLength } from '@/lib/press-engine'
import { createDefaultMetadata } from '@/utils/metadata'

import {
  ArticleEntry,
  FeaturedArticle,
  GallerySection,
  PressHero,
} from './_sections/articles'
import { PodcastsSection } from './_sections/podcasts'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.press' })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.press,
  })
}

export default async function PressPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`PressPage received non-active locale "${locale}"`)
  }

  const { articles, podcasts } = await getPressPageData()
  if (articles.length === 0) {
    throw new Error('Press page requires at least one article from press API')
  }
  if (podcasts.length === 0) {
    throw new Error('Press page requires at least one podcast from press API')
  }

  const repeatedArticles = repeatToLength(articles, 12)
  const galleryArticles = articles.slice(0, 4)
  const featuredArticle =
    articles.find((article) => article.href.endsWith('/article/realfi-hack')) ??
    articles[0]

  return (
    <div className="bg-accent-tan pt-10">
      <PressHero lead={articles[0]} />
      <section className="bg-accent-tan">
        {repeatedArticles.slice(0, 4).map((article, index) => (
          <ArticleEntry key={`top-${index}`} article={article} index={index} />
        ))}
        <GallerySection articles={galleryArticles} />
        {repeatedArticles.slice(4, 8).map((article, index) => (
          <ArticleEntry key={`mid-${index}`} article={article} index={index} />
        ))}
        <FeaturedArticle article={featuredArticle} />
        {repeatedArticles.slice(8, 12).map((article, index) => (
          <ArticleEntry
            key={`bottom-${index}`}
            article={article}
            index={index}
          />
        ))}
      </section>
      <PodcastsSection podcasts={podcasts} />
    </div>
  )
}
