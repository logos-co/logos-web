import { env } from '@/lib/env'

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
  title: 'Logos Next Tailwind Template',
  description: 'Template for Next.js, Tailwind CSS, and Acid Info LSD',
  url: env.NEXT_PUBLIC_SITE_URL ?? 'https://logos.co',
  keywords: ['Logos', 'Web3'],
  defaultLocale: 'en',
}

export default siteConfig
