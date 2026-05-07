import { getAllRfps, getBuilderHubListingSettings } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { BuildersHubListingClient } from '@/components/sections/builders-hub/builders-hub-listing-client'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

const ROUTE = ROUTES.rfps

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }
  const settings = await getBuilderHubListingSettings({ page: 'rfps', locale })
  return createDefaultMetadata({
    title: settings.title,
    description: settings.description,
    locale,
    path: ROUTE,
  })
}

export default async function RfpsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`RfpsPage received non-active locale "${locale}"`)
  }

  const [settings, allRfps] = await Promise.all([
    getBuilderHubListingSettings({ page: 'rfps', locale }),
    getAllRfps({ locale, status: 'published' }),
  ])

  return <BuildersHubListingClient kind="rfps" settings={settings} items={allRfps} />
}
