import siteConfig from '@/constants/site-config'
import { Metadata } from 'next'

type DefaultMetadataProps = {
  locale: string
  title?: string
  description?: string
  path?: string
}

const baseUrl = siteConfig.url

export function absoluteUrl(
  path: string,
  locale: string = siteConfig.defaultLocale
) {
  return `${siteConfig.url}${locale === siteConfig.defaultLocale ? '' : `/${locale}`}${path}`
}

export async function createDefaultMetadata({
  title = '',
  description = '',
  locale,
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
          url: absoluteUrl('/images/home/hero-bg.jpg'),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/images/home/hero-bg.jpg')],
    },
    icons: '/favicon.ico',
    creator: siteConfig.name,
    keywords: siteConfig.keywords,
    robots: {
      index: process.env.NEXT_PUBLIC_API_MODE === 'production',
      follow: true,
    },
  }
}
