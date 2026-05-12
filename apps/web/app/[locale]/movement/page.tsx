import { getTranslations } from 'next-intl/server'
import { getCircles, getCirclesSettings } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { MovementPageView } from '@/components/sections/movement/movement-page'
import { ROUTES } from '@/constants/routes'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

const NAMESPACE = 'pages.movement'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.movement,
})

export default async function MovementPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`MovementPage received non-active locale "${locale}"`)
  }

  const t = await getTranslations({ locale, namespace: NAMESPACE })
  const [circlesSettings, circles] = await Promise.all([
    getCirclesSettings(locale),
    getCircles({ locale, status: 'published' }),
  ])

  return (
    <MovementPageView
      t={t}
      circlesSettings={circlesSettings}
      circles={circles}
    />
  )
}
