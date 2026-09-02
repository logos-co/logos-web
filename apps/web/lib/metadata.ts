import siteConfig from '@/constants/site-config'
import { env } from '@/lib/env'
import { faviconIcons } from '@/lib/favicon'
import type { Metadata } from 'next'

type DefaultMetadataProps = {
  locale: string
  noindex?: boolean
  title?: string
  description?: string
  keywords?: string[]
  path?: string
}

const baseUrl = siteConfig.url.replace(/\/+$/, '')

export function absoluteUrl(
  path: string,
  locale: string = siteConfig.defaultLocale
) {
  const localeSegment = locale === siteConfig.defaultLocale ? '' : `/${locale}`
  const normalizedPath = path === '' || path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${localeSegment}${normalizedPath}`
}

export async function createDefaultMetadata({
  title = '',
  description = '',
  keywords,
  locale,
  noindex = false,
  path = '',
}: DefaultMetadataProps): Promise<Metadata> {
  const _title = title || siteConfig.title
  const _description = description || siteConfig.description

  const fullUrl = absoluteUrl(path)

  return {
    title: _title,
    description: _description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: fullUrl,
      languages: {
        en: fullUrl,
        'x-default': fullUrl,
      },
    },
    openGraph: {
      title: _title,
      description: _description,
      url: fullUrl,
      type: 'website',
      locale,
      siteName: siteConfig.name,
      images: [
        {
          url: absoluteUrl('/og.jpeg'),
          width: 1200,
          height: 630,
          alt: _title,
        },
      ],
    },
    // Use the resolved values, not the raw arguments: a page that relies on the
    // site-level title/description fallback would otherwise ship empty Twitter
    // tags and an empty OG image alt.
    twitter: {
      card: 'summary_large_image',
      title: _title,
      description: _description,
      images: [absoluteUrl('/og.jpeg')],
    },
    icons: faviconIcons,
    creator: siteConfig.name,
    keywords: keywords ?? siteConfig.keywords,
    robots: {
      index: !noindex && env.NEXT_PUBLIC_API_MODE === 'production',
      follow: !noindex,
    },
  }
}
