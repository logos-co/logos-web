import { getTranslations } from 'next-intl/server'
import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import {
  BLOG_ORIGIN,
  getBlogPageData,
  repeatToLength,
} from '@/lib/blog-engine'
import { createDefaultMetadata } from '@/lib/metadata'

import {
  ArticleEntry,
  ArticlesCta,
  ArticlesHeading,
  BroadcastSection,
  FeaturedArticle,
  GallerySection,
  BlogHero,
} from './_sections/articles'
import { PodcastsSection } from './_sections/podcasts'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.blog' })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.blog,
  })
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`BlogPage received non-active locale "${locale}"`)
  }

  const { articles, podcasts } = await getBlogPageData()
  if (articles.length === 0) {
    throw new Error('Blog page requires at least one article from blog API')
  }
  if (podcasts.length === 0) {
    throw new Error('Blog page requires at least one podcast from blog API')
  }

  const repeatedArticles = repeatToLength(articles, 12)
  const galleryArticles = articles.slice(0, 4)
  const latestBroadcastEpisode = podcasts[0]
  const featuredArticle =
    articles.find((article) => article.href.endsWith('/article/realfi-hack')) ??
    articles[0]
  const t = await getTranslations({ locale, namespace: 'pages.blog' })

  return (
    <div className="bg-accent-tan pt-10">
      <BlogHero
        copy={{
          heroTagline: t('hero.tagline'),
          heroHeadingLine1: t('hero.line1'),
          heroHeadingLine2: t('hero.line2'),
          navLabel: t('nav.label'),
          navArticles: t('nav.articles'),
          navPodcasts: t('nav.podcasts'),
          navBroadcast: t('nav.broadcast'),
          navBroadcastHref: '#broadcast',
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
        <FeaturedArticle
          article={featuredArticle}
          readArticleLabel={t('articles.readArticle')}
        />
        {repeatedArticles.slice(8, 12).map((article, index) => (
          <ArticleEntry
            key={`bottom-${index}`}
            article={article}
            index={index}
          />
        ))}
        <ArticlesCta
          href={`${BLOG_ORIGIN}/search?type=article`}
          label={t('articles.seeMore')}
        />
      </section>
      <PodcastsSection
        podcasts={podcasts}
        ctaHref={ROUTES.podcast}
        copy={{
          heading: t('podcasts.heading'),
          media: t('podcasts.media'),
          heroTitle: t('podcasts.heroTitle'),
          heroDescription: t('podcasts.heroDescription'),
          latestEpisode: t('podcasts.latestEpisode'),
          seeAllEpisodes: t('podcasts.seeAllEpisodes'),
          listenOnApp: t('podcasts.listenOnApp'),
          cta: t('podcasts.cta'),
          episodePrefix: t('podcasts.episodePrefix'),
          fallbackEpisode: t('podcasts.fallbackEpisode'),
        }}
      />
      <BroadcastSection
        href={ROUTES.logosBroadcastNetwork}
        latestEpisodeTitle={latestBroadcastEpisode.title}
        copy={{
          broadcastHeading: t('broadcast.heading'),
          broadcastDescription: t('broadcast.description'),
          media: t('broadcast.media'),
          latestEpisode: t('broadcast.latestEpisode'),
          broadcastCta: t('broadcast.cta'),
        }}
      />
    </div>
  )
}
