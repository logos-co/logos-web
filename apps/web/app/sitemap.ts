import type { MetadataRoute } from 'next'

import { getAllIdeas, getAllRfps, getCircles } from '@repo/content/loaders'

import siteConfig from '@/constants/site-config'
import { ROUTES } from '@/constants/routes'
import { ROUTE_AVAILABILITY } from '@/constants/route-availability'

export const dynamic = 'force-static'

const staticIndexableRoutes = [
  ROUTES.home,
  ROUTES.activeCircles,
  ROUTES.book,
  ROUTES.brandKit,
  ROUTES.buildersHub,
  ROUTES.ideas,
  ROUTES.rfps,
  ROUTES.circles,
  ROUTES.faq,
  ROUTES.getStarted,
  ROUTES.lambdaPrize,
  ROUTES.logosBroadcastNetwork,
  ROUTES.movement,
  ROUTES.nodeProgramme,
  ROUTES.podcast,
  ROUTES.blog,
  ROUTES.privacy,
  ROUTES.research,
  ROUTES.security,
  ROUTES.technologyStack,
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
] as const

const buildSitemapEntry = (
  route: string,
  lastModified: string
): MetadataRoute.Sitemap[number] => {
  const normalizedSiteUrl = siteConfig.url.replace(/\/+$/, '')
  return {
    url:
      route === '/' ? `${normalizedSiteUrl}/` : `${normalizedSiteUrl}${route}`,
    lastModified,
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date().toISOString().split('T')[0]!
  const [rfps, ideas, circles] = await Promise.all([
    getAllRfps({ locale: 'en', status: 'published' }),
    getAllIdeas({ locale: 'en', status: 'published' }),
    getCircles({ locale: 'en', status: 'published' }),
  ])

  const routes = [
    ...staticIndexableRoutes,
    ...rfps.map((rfp) => `${ROUTES.rfps}/${rfp.slug}`),
    ...ideas.map((idea) => `${ROUTES.ideas}/${idea.slug}`),
    ...(ROUTE_AVAILABILITY.circleDetailLinks
      ? circles.map((circle) => ROUTES.circle(circle.slug))
      : []),
  ]

  return [...new Set(routes)]
    .sort((a, b) => a.localeCompare(b))
    .map((route) => buildSitemapEntry(route, lastModified))
}
