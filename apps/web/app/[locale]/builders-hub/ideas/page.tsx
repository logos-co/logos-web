import {
  getAllIdeas,
  getBuilderHubListingSettings,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { BuildersHubListingClient } from '@/components/sections/builders-hub/builders-hub-listing-client'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

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

  const [settings, allIdeas] = await Promise.all([
    getBuilderHubListingSettings({ page: 'ideas', locale }),
    getAllIdeas({ locale, status: 'published' }),
  ])

  return <BuildersHubListingClient kind="ideas" settings={settings} items={allIdeas} />
}
