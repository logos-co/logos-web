import type { MetadataRoute } from 'next'

import siteConfig from '@/constants/site-config'
import { env } from '@/lib/env'

export const dynamic = 'force-static'

/**
 * Only the production deploy invites crawlers.
 *
 * `dev.logos.co` builds the same 73 pages from the same content, so leaving it
 * open makes the staging host a near-complete duplicate of production. Page
 * metadata already gates the robots meta tag on `NEXT_PUBLIC_API_MODE`
 * (`lib/metadata.ts`), which keeps staging out of the index — this closes the
 * remaining gap by keeping crawlers off it entirely, and stops staging
 * advertising its own sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = env.NEXT_PUBLIC_API_MODE === 'production'

  if (!isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
