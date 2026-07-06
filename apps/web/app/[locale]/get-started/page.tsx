import {
  getBuilderHubSettings,
  getPageCopy,
  resolveBuilderHubHomeRfps,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { GetStartedCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { GetStartedPage } from './_sections/get-started-page'

const ROUTE = ROUTES.getStarted

const findSection = createSectionFinder('get-started')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`GetStartedPage received non-active locale "${locale}"`)
  }

  const [page, builderHubSettings, rfpResolution] = await Promise.all([
    getPageCopy(ROUTE, locale),
    getBuilderHubSettings(locale),
    resolveBuilderHubHomeRfps(locale),
  ])

  const copySection = findSection<GetStartedCopySection>(
    page.sections,
    'getStartedCopy',
    'getStarted.copy'
  )

  if (!builderHubSettings.prepare) {
    throw new Error('GetStartedPage requires Builders Hub prepare settings')
  }
  if (!builderHubSettings.programs) {
    throw new Error('GetStartedPage requires Builders Hub programs settings')
  }

  return (
    <GetStartedPage
      data={copySection}
      basecampInstall={builderHubSettings.prepare}
      developerPrograms={builderHubSettings.programs}
      rfps={rfpResolution.rfps}
    />
  )
}
