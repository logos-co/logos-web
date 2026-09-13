import type { Metadata } from 'next'

import { isActiveLocale } from '@repo/content/locales'

import { JsonLd } from '@/components/seo/json-ld'
import { ROUTES } from '@/constants/routes'
import { absoluteUrl, createDefaultMetadata } from '@/lib/metadata'

import { OG_IMAGE, SEO } from './_content'
import { FieldStationPage } from './_sections/field-station-page'
import {
  createFieldStationBreadcrumbJsonLd,
  createFieldStationEventJsonLd,
} from './_structured-data'

const ROUTE = ROUTES.fieldStation

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }

  const metadata = await createDefaultMetadata({
    title: SEO.title,
    description: SEO.description,
    locale,
    path: ROUTE,
  })

  // The site default card is `/og.jpeg`; this campaign ships its own.
  const ogImageUrl = absoluteUrl(OG_IMAGE.src)

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE.width,
          height: OG_IMAGE.height,
          alt: OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      ...metadata.twitter,
      images: [ogImageUrl],
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`FieldStationPage received non-active locale "${locale}"`)
  }

  return (
    <>
      <JsonLd data={createFieldStationBreadcrumbJsonLd(locale)} />
      <JsonLd data={createFieldStationEventJsonLd()} />
      <FieldStationPage />
    </>
  )
}
