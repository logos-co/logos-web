import { getTranslations } from 'next-intl/server'
import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import {
  PRESS_ORIGIN,
  getPressPageData,
  repeatToLength,
} from '@/lib/press-engine'
import { createDefaultMetadata } from '@/lib/metadata'

import {
  ArticleEntry,
  ArticlesCta,
  ArticlesHeading,
  BroadcastSection,
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
  const broadcastArticles = repeatToLength(articles, 4)
  const featuredArticle =
    articles.find((article) => article.href.endsWith('/article/realfi-hack')) ??
    articles[0]
  const t = await getTranslations({ locale, namespace: 'pages.press' })

  return (
    <div className="bg-accent-tan pt-10">
      <PressHero
        lead={articles[0]}
        copy={{
          heroHeading: t('heading'),
          navArticles: t('nav.articles'),
          navPodcasts: t('nav.podcasts'),
          navBroadcast: t('nav.broadcast'),
        }}
      />
      <section className="bg-accent-tan">
        <ArticlesHeading label={t('articles.heading')} />
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
        <ArticlesCta
          href={`${PRESS_ORIGIN}/articles`}
          label={t('articles.seeMore')}
        />
      </section>
      <PodcastsSection
        podcasts={podcasts}
        copy={{
          heading: t('podcasts.heading'),
          media: t('podcasts.media'),
          heroTitle: t('podcasts.heroTitle'),
          heroDescription: t('podcasts.heroDescription'),
          latestEpisode: t('podcasts.latestEpisode'),
          seeAllEpisodes: t('podcasts.seeAllEpisodes'),
          listenOnApp: t('podcasts.listenOnApp'),
        }}
      />
      <BroadcastSection
        articles={broadcastArticles}
        copy={{
          broadcastHeading: t('broadcast.heading'),
          broadcastDescription: t('broadcast.description'),
          watch: t('broadcast.watch'),
          broadcastCta: t('broadcast.cta'),
        }}
      />
    </div>
  )
}
