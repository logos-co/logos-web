import type { MetadataRoute } from 'next'

import {
  flattenFieldGuideItems,
  getAllIdeas,
  getAllRfps,
  getCircles,
  getFieldGuideManifest,
} from '@repo/content/loaders'

import siteConfig from '@/constants/site-config'
import { ROUTES } from '@/constants/routes'
import { ROUTE_AVAILABILITY } from '@/constants/route-availability'
import {
  getBlogArticleDetail,
  getBlogArticleSlugs,
  getBlogPodcastDetail,
  getBlogPodcastPaths,
} from '@/lib/blog-content'

export const dynamic = 'force-static'

const staticIndexableRoutes = [
  ROUTES.home,
  ROUTES.activeCircles,
  ROUTES.book,
  ROUTES.designGuide,
  ROUTES.buildersHub,
  ROUTES.ideas,
  ROUTES.rfps,
  ROUTES.getStarted,
  ROUTES.lambdaPrize,
  ROUTES.logosBroadcastNetwork,
  ROUTES.manifesto,
  ROUTES.movement,
  ROUTES.buildTheParallel,
  ROUTES.nodeProgramme,
  ROUTES.operators,
  ROUTES.podcast,
  ROUTES.media,
  ROUTES.privacy,
  ROUTES.research,
  ROUTES.security,
  ROUTES.testnetFaqs,
  ROUTES.testnetTermsAndConditions,
  ROUTES.technologyStack,
  ROUTES.roadmap,
  ROUTES.basecamp,
  ROUTES.blockchain,
  ROUTES.messaging,
  ROUTES.networking,
  ROUTES.storage,
  ROUTES.terms,
  // /contact is excluded -- it redirects to the homepage and should not be indexed
  ROUTES.activistBuilder,
  ROUTES.activistLeaderSteward,
  ROUTES.coalitionPartner,
  ...(ROUTE_AVAILABILITY.about ? [ROUTES.about] : []),
  ROUTES.fieldGuide,
] as const

const buildSitemapEntry = (
  route: string,
  lastModified?: string | null
): MetadataRoute.Sitemap[number] => {
  const normalizedSiteUrl = siteConfig.url.replace(/\/+$/, '')
  return {
    url:
      route === '/' ? `${normalizedSiteUrl}/` : `${normalizedSiteUrl}${route}`,
    ...(lastModified ? { lastModified } : {}),
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rfps, ideas, circles, fieldGuide, articleSlugs, podcastPaths] =
    await Promise.all([
      getAllRfps({ locale: 'en', status: 'published' }),
      getAllIdeas({ locale: 'en', status: 'published' }),
      getCircles({ locale: 'en', status: 'published' }),
      getFieldGuideManifest('en'),
      getBlogArticleSlugs(),
      getBlogPodcastPaths(),
    ])

  // Index chapter is served by ROUTES.fieldGuide (already in the static list).
  const fieldGuideChapters = flattenFieldGuideItems(fieldGuide)
    .filter((item) => item.slug !== 'index')
    .map((item) => ROUTES.fieldGuideChapter(item.slug))

  const staticRoutes = [
    ...staticIndexableRoutes,
    ...rfps.map((rfp) => `${ROUTES.rfps}/${rfp.slug}`),
    ...ideas.map((idea) => `${ROUTES.ideas}/${idea.slug}`),
    ...(ROUTE_AVAILABILITY.circleDetailLinks
      ? circles.map((circle) => ROUTES.circle(circle.slug))
      : []),
    ...fieldGuideChapters,
  ]

  const [articles, podcasts] = await Promise.all([
    Promise.all(articleSlugs.map((slug) => getBlogArticleDetail(slug))),
    Promise.all(
      podcastPaths.map((path) => getBlogPodcastDetail(path.showSlug, path.slug))
    ),
  ])

  const entries: MetadataRoute.Sitemap = [
    ...staticRoutes.map((route) => buildSitemapEntry(route)),
    ...articles
      .filter((article) => !article.isDraft && article.publishedAt)
      .map((article) =>
        buildSitemapEntry(
          ROUTES.mediaArticle(article.slug),
          article.modifiedAt ?? article.publishedAt
        )
      ),
    ...podcasts
      .filter((podcast) => !podcast.isDraft && podcast.publishedAt)
      .map((podcast) =>
        buildSitemapEntry(
          ROUTES.mediaPodcast(podcast.showSlug, podcast.slug),
          podcast.modifiedAt ?? podcast.publishedAt
        )
      ),
  ]

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()].sort(
    (a, b) => a.url.localeCompare(b.url)
  )
}
