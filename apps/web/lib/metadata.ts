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
  image?: {
    url: string
    width?: number
    height?: number
    alt?: string
  } | null
  openGraphType?: 'article' | 'website'
  publishedTime?: string | null
  modifiedTime?: string | null
  authors?: string[]
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
  image,
  openGraphType = 'website',
  publishedTime,
  modifiedTime,
  authors,
}: DefaultMetadataProps): Promise<Metadata> {
  const _title = title || siteConfig.title
  const _description = description || siteConfig.description

  const fullUrl = absoluteUrl(path)
  const socialImage = image ?? {
    url: absoluteUrl('/og.jpeg'),
    width: 1200,
    height: 630,
    alt: _title,
  }

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
      types: {
        'application/rss+xml': [
          { url: absoluteUrl('/rss/main.xml'), title: 'Logos Media' },
          { url: absoluteUrl('/rss/logos-state.xml'), title: 'Logos Podcast' },
        ],
        'application/atom+xml': absoluteUrl('/atom.xml'),
      },
    },
    openGraph: {
      title: _title,
      description: _description,
      url: fullUrl,
      type: openGraphType,
      locale,
      siteName: siteConfig.name,
      images: [socialImage],
      ...(openGraphType === 'article'
        ? {
            publishedTime: publishedTime ?? undefined,
            modifiedTime: modifiedTime ?? undefined,
            authors,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage.url],
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
