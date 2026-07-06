import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { MediaCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import {
  BLOG_ORIGIN,
  getBlogPageData,
  repeatToLength,
} from '@/lib/blog-engine'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

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

const ROUTE = ROUTES.media

const findSection = createSectionFinder('media')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`BlogPage received non-active locale "${locale}"`)
  }

  const [page, { articles, podcasts }] = await Promise.all([
    getPageCopy(ROUTE, locale),
    getBlogPageData(),
  ])

  if (articles.length === 0) {
    throw new Error('Blog page requires at least one article from blog API')
  }
  if (podcasts.length === 0) {
    throw new Error('Blog page requires at least one podcast from blog API')
  }

  const data = findSection<MediaCopySection>(
    page.sections,
    'mediaCopy',
    'media.copy',
  )

  const repeatedArticles = repeatToLength(articles, 12)
  const galleryArticles = articles.slice(0, 4)
  const latestBroadcastEpisode = podcasts[0]
  const featuredArticle =
    articles.find((article) => article.href.endsWith('/article/realfi-hack')) ??
    articles[0]

  return (
    <div className="bg-accent-tan pt-10">
      <BlogHero
        copy={{
          heroTagline: data.hero.tagline,
          heroHeadingLine1: data.hero.line1,
          heroHeadingLine2: data.hero.line2,
          navLabel: data.nav.label,
          navArticles: data.nav.articles,
          navPodcasts: data.nav.podcasts,
          navBroadcast: data.nav.broadcast,
          navBroadcastHref: '#broadcast',
        }}
      />
      <section className="bg-accent-tan">
        <ArticlesHeading label={data.articles.heading} />
        {repeatedArticles.slice(0, 4).map((article, index) => (
          <ArticleEntry key={`top-${index}`} article={article} index={index} />
        ))}
        <GallerySection articles={galleryArticles} />
        {repeatedArticles.slice(4, 8).map((article, index) => (
          <ArticleEntry key={`mid-${index}`} article={article} index={index} />
        ))}
        <FeaturedArticle
          article={featuredArticle}
          readArticleLabel={data.articles.readArticle}
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
          label={data.articles.seeMore}
        />
      </section>
      <PodcastsSection
        podcasts={podcasts}
        ctaHref={ROUTES.podcast}
        copy={{
          heading: data.podcasts.heading,
          media: data.podcasts.media,
          heroTitle: data.podcasts.heroTitle,
          heroDescription: data.podcasts.heroDescription,
          latestEpisode: data.podcasts.latestEpisode,
          seeAllEpisodes: data.podcasts.seeAllEpisodes,
          listenOnApp: data.podcasts.listenOnApp,
          cta: data.podcasts.cta,
          episodePrefix: data.podcasts.episodePrefix,
          fallbackEpisode: data.podcasts.fallbackEpisode,
        }}
      />
      <BroadcastSection
        href={ROUTES.logosBroadcastNetwork}
        latestEpisodeTitle={latestBroadcastEpisode.title}
        copy={{
          broadcastHeading: data.broadcast.heading,
          broadcastDescription: data.broadcast.description,
          media: data.broadcast.media,
          latestEpisode: data.broadcast.latestEpisode,
          broadcastCta: data.broadcast.cta,
        }}
      />
    </div>
  )
}
