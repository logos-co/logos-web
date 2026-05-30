import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  CardGridSection,
  FeaturedTextSection,
  GiantSwitchSection,
  HeroSection,
  TableSection,
  TechStackOverviewSection,
} from '@repo/content/schemas'

import TechOverviewHero from '@/components/sections/technology-stack/tech-overview-hero'
import TechOverviewLogosApp from '@/components/sections/technology-stack/tech-overview-logos-app'
import TechOverviewModular from '@/components/sections/technology-stack/tech-overview-modular'
import TechOverviewOpenSource from '@/components/sections/technology-stack/tech-overview-open-source'
import TechOverviewStack from '@/components/sections/technology-stack/tech-overview-stack'
import TechOverviewUseCases from '@/components/sections/technology-stack/tech-overview-use-cases'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.technologyStack

export const generateMetadata = createPageMetadata(ROUTE)

const findSection = createSectionFinder('technology-stack')

export default async function TechnologyStackPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(
      `TechnologyStackPage received non-active locale "${locale}"`
    )
  }
  const page = await getPageCopy(ROUTE, locale)

  const hero = findSection<HeroSection>(page.sections, 'hero', 'techStack.hero')
  const overview = findSection<TechStackOverviewSection>(
    page.sections,
    'techStackOverview',
    'techStack.overview'
  )
  const appInstall = findSection<GiantSwitchSection>(
    page.sections,
    'giantSwitch',
    'techStack.appInstall'
  )
  const modular = findSection<FeaturedTextSection>(
    page.sections,
    'featuredText',
    'techStack.modular'
  )
  const openSource = findSection<TableSection>(
    page.sections,
    'table',
    'techStack.openSource'
  )
  const useCases = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'techStack.useCases'
  )

  return (
    <div className="mx-auto max-w-[1440px]">
      <TechOverviewHero data={hero} />
      <TechOverviewStack
        data={overview}
        networkingHref={ROUTES.networking}
        foundationHref={ROUTE}
      />
      <TechOverviewUseCases data={useCases} />
      <TechOverviewModular data={modular} />
      <TechOverviewOpenSource data={openSource} />
      <TechOverviewLogosApp data={appInstall} />
    </div>
  )
}
