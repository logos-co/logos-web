import { getTranslations } from 'next-intl/server'

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
  const t = await getTranslations({ locale, namespace: NAMESPACE })
  return <MovementPageView t={t} />
}
