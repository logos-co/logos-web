import {
  getBuilderHubSettings,
  resolveBuilderHubHomeIdeas,
  resolveBuilderHubHomeRfps,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { BuildersHubHome } from '@/components/sections/builders-hub'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'

const ROUTE = ROUTES.buildersHub

export const generateMetadata = createPageMetadata(ROUTE)

export default async function BuildersHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`BuildersHubPage received non-active locale "${locale}"`)
  }

  const [settings, rfpResolution, ideaResolution] = await Promise.all([
    getBuilderHubSettings(locale),
    resolveBuilderHubHomeRfps(locale),
    resolveBuilderHubHomeIdeas(locale),
  ])

  return (
    <BuildersHubHome
      settings={settings}
      rfpResolution={rfpResolution}
      ideaResolution={ideaResolution}
    />
  )
}
