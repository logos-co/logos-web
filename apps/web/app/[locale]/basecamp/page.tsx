import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  CardGridSection,
  CtaPanelSection,
  FeaturedTextSection,
  HeroSection,
  TableSection,
} from '@repo/content/schemas'

import { BasecampPage } from '@/components/sections/basecamp'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.basecamp

export const generateMetadata = createPageMetadata(ROUTE)

const findSection = createSectionFinder('basecamp')

export default async function BasecampRoutePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`BasecampRoutePage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)
  const hero = findSection<HeroSection>(page.sections, 'hero', 'basecamp.hero')
  const howItWorks = findSection<TableSection>(
    page.sections,
    'table',
    'basecamp.howItWorks'
  )
  const localFirst = findSection<CtaPanelSection>(
    page.sections,
    'ctaPanel',
    'basecamp.localFirst'
  )
  const modular = findSection<FeaturedTextSection>(
    page.sections,
    'featuredText',
    'basecamp.modular'
  )
  const capabilities = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'basecamp.capabilities'
  )
  const resources = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'basecamp.resources'
  )

  return (
    <BasecampPage
      hero={hero}
      howItWorks={howItWorks}
      localFirst={localFirst}
      modular={modular}
      capabilities={capabilities}
      resources={resources}
    />
  )
}
