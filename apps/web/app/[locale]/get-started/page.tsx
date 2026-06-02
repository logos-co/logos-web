import { getTranslations } from 'next-intl/server'

import { ROUTES } from '@/constants/routes'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

import { GetStartedPage } from './_sections/get-started-page'

const NAMESPACE = 'pages.getStarted'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.getStarted,
})

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: NAMESPACE })

  return <GetStartedPage t={t} />
}
