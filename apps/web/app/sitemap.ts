import { MetadataRoute } from 'next'
import siteConfig from '@/constants/site-config'
import { ROUTES } from '@/constants/routes'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteConfig.url

  const routes = [ROUTES.home, ROUTES.activeCircles].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes]
}
