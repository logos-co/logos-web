import { getTranslations } from 'next-intl/server'
import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { MediaListingIntro } from '@/components/sections/media/media-listing-intro'
import { ROUTES } from '@/constants/routes'
import { getBlogArticleListing } from '@/lib/blog-engine'
import { createPageMetadata } from '@/lib/page-metadata'
import { ArticleSearch } from './_components/article-search'

import {
  ArticleEntry,
  ArticlesCta,
  ArticlesHeading,
  FeaturedArticle,
} from '../media/_sections/articles'

export const generateMetadata = createPageMetadata(ROUTES.articles)

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`ArticlesPage received non-active locale "${locale}"`)
  }

  const [page, articles, t] = await Promise.all([
    getPageCopy(ROUTES.articles, locale),
    getBlogArticleListing(),
    getTranslations({ locale, namespace: 'articleListing' }),
  ])
  const [latestArticle, ...remainingArticles] = articles
  if (!latestArticle) {
    throw new Error('Articles page requires at least one published article')
  }

  return (
    <div className="overflow-hidden bg-accent-tan pb-10">
      <MediaListingIntro
        copy={{
          title: page.heading ?? page.title,
          description: page.description,
          backToMedia: t('backToMedia'),
        }}
      />
      <section className="bg-accent-tan pt-20">
        <ArticlesHeading label={t('latestHeading')} />
        <ArticleSearch articles={articles}>
          <FeaturedArticle
            article={latestArticle}
            readArticleLabel={t('readArticle')}
          />
          {remainingArticles.map((article, index) => (
            <ArticleEntry key={article.href} article={article} index={index} />
          ))}
        </ArticleSearch>
        <ArticlesCta href={ROUTES.media} label={t('backToMedia')} />
      </section>
    </div>
  )
}
