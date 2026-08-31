import type { MetadataRoute } from 'next'

import {
  flattenFieldGuideItems,
  getAllIdeas,
  getCircles,
  getFieldGuideManifest,
} from '@repo/content/loaders'

import siteConfig from '@/constants/site-config'
import { ROUTES } from '@/constants/routes'
import { ROUTE_AVAILABILITY } from '@/constants/route-availability'
import { fetchGithubRfps } from '@/lib/rfps-github'

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
  ROUTES.chatControl,
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
  // /one-pager is excluded -- it is useless without the signed token in the
  // emailed link, and its metadata is noindex
  ...(ROUTE_AVAILABILITY.about ? [ROUTES.about] : []),
  ROUTES.fieldGuide,
] as const

const buildSitemapEntry = (route: string): MetadataRoute.Sitemap[number] => {
  const normalizedSiteUrl = siteConfig.url.replace(/\/+$/, '')
  return {
    url:
      route === '/' ? `${normalizedSiteUrl}/` : `${normalizedSiteUrl}${route}`,
  }
}

// RFPs come from the live GitHub listing. A partial or failed fetch must fail
// the build rather than quietly ship a sitemap missing every RFP detail URL.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rfps, ideas, circles, fieldGuide] = await Promise.all([
    fetchGithubRfps(),
    getAllIdeas({ locale: 'en', status: 'published' }),
    getCircles({ locale: 'en', status: 'published' }),
    getFieldGuideManifest('en'),
  ])

  // Index chapter is served by ROUTES.fieldGuide (already in the static list).
  const fieldGuideChapters = flattenFieldGuideItems(fieldGuide)
    .filter((item) => item.slug !== 'index')
    .map((item) => ROUTES.fieldGuideChapter(item.slug))

  const routes = [
    ...staticIndexableRoutes,
    ...rfps.map((rfp) => `${ROUTES.rfps}/${rfp.slug}`),
    ...ideas.map((idea) => `${ROUTES.ideas}/${idea.slug}`),
    ...(ROUTE_AVAILABILITY.circleDetailLinks
      ? circles.map((circle) => ROUTES.circle(circle.slug))
      : []),
    ...fieldGuideChapters,
  ]

  return [...new Set(routes)]
    .sort((a, b) => a.localeCompare(b))
    .map(buildSitemapEntry)
}
