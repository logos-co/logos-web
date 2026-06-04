import { getBuilderHubSettings } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
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
  if (!isActiveLocale(locale)) {
    throw new Error(`GetStartedPage received non-active locale "${locale}"`)
  }

  const [t, builderHubSettings] = await Promise.all([
    getTranslations({ locale, namespace: NAMESPACE }),
    getBuilderHubSettings(locale),
  ])

  if (!builderHubSettings.prepare) {
    throw new Error('GetStartedPage requires Builders Hub prepare settings')
  }

  return <GetStartedPage t={t} basecampInstall={builderHubSettings.prepare} />
}
