import { notFound } from 'next/navigation'

import {
  getCircleBySlug,
  getCircleEvents,
  getCircleInitiatives,
  getCircles,
  getCirclesSettings,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { CircleDetailPageView } from '@/components/sections/circles'
import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { createDefaultMetadata } from '@/lib/metadata'

export const dynamicParams = false

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = []

  for (const locale of routing.locales) {
    if (!isActiveLocale(locale)) continue
    const circles = await getCircles({ locale, status: 'published' })
    params.push(...circles.map((circle) => ({ locale, slug: circle.slug })))
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }

  const circle = await getCircleBySlug(slug, locale)
  return createDefaultMetadata({
    title: `${circle.name} Circle`,
    description: circle.description,
    locale,
    path: ROUTES.circle(slug),
  })
}

export default async function CircleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`CircleDetailPage received non-active locale "${locale}"`)
  }

  try {
    const [circle, settings, events, initiatives] = await Promise.all([
      getCircleBySlug(slug, locale),
      getCirclesSettings(locale),
      getCircleEvents({ circleSlug: slug, locale, status: 'published' }),
      getCircleInitiatives({ circleSlug: slug, locale, status: 'published' }),
    ])

    return (
      <CircleDetailPageView
        circle={circle}
        events={events}
        initiatives={initiatives}
        settings={settings}
        locale={locale}
      />
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('failed to read')) {
      notFound()
    }
    throw error
  }
}
