import {
  getAllIdeas,
  getBuilderHubListingSettings,
  getPageCopy,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { BuildersHubListingClient } from '@/components/sections/builders-hub/builders-hub-listing-client'
import { JsonLd } from '@/components/seo/json-ld'
import { ROUTES } from '@/constants/routes'
import siteConfig from '@/constants/site-config'
import { createDefaultMetadata } from '@/lib/metadata'
import { createBreadcrumbListJsonLd } from '@/lib/structured-data'

const ROUTE = ROUTES.ideas

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }
  const settings = await getBuilderHubListingSettings({ page: 'ideas', locale })
  return createDefaultMetadata({
    title: settings.title,
    description: settings.description,
    locale,
    path: ROUTE,
  })
}

export default async function IdeasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`IdeasPage received non-active locale "${locale}"`)
  }

  const [settings, allIdeas, buildersHub] = await Promise.all([
    getBuilderHubListingSettings({ page: 'ideas', locale }),
    getAllIdeas({ locale, status: 'published' }),
    getPageCopy(ROUTES.buildersHub, locale),
  ])

  return (
    <>
      <JsonLd
        data={createBreadcrumbListJsonLd(
          [
            { name: siteConfig.name, path: ROUTES.home },
            {
              name: buildersHub.heading ?? buildersHub.title,
              path: ROUTES.buildersHub,
            },
            { name: settings.breadcrumbLabel, path: ROUTE },
          ],
          locale
        )}
      />
      <BuildersHubListingClient
        kind="ideas"
        settings={settings}
        items={allIdeas}
      />
    </>
  )
}
