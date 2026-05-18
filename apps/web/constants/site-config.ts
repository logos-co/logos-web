import { env } from '@/lib/env'

import siteSettings from '../../../content/site/en/settings.json'

type SiteConfig = {
  name: string
  title: string
  description: string
  url: string
  defaultLocale: string
  keywords: string[]
}

const siteConfig: SiteConfig = {
  name: 'Logos',
  title: siteSettings.siteTitle,
  description: siteSettings.siteDescription,
  url: env.NEXT_PUBLIC_SITE_URL ?? 'https://logos.co',
  keywords: siteSettings.keywords,
  defaultLocale: 'en',
}

export default siteConfig
