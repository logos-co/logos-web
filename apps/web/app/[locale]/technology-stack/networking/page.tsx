import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  CardGridSection,
  CtaPanelSection,
  HeroSection,
  RelatedArticlesSection,
} from '@repo/content/schemas'

import NetworkingFeatures from '@/components/sections/networking/networking-features'
import NetworkingHero from '@/components/sections/networking/networking-hero'
import NetworkingIntro from '@/components/sections/networking/networking-intro'
import TechStackBuilderCta from '@/components/sections/shared/tech-stack-builder-cta'
import TechStackRelatedArticles from '@/components/sections/shared/tech-stack-related-articles'
import TechStackExplorer from '@/components/sections/shared/tech-stack-explorer'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getLatestPressArticles } from '@/lib/press-engine'

const ROUTE = ROUTES.networking

export const generateMetadata = createPageMetadata(ROUTE)

const findSection = createSectionFinder('networking')

export default async function NetworkingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`NetworkingPage received non-active locale "${locale}"`)
  }
  const page = await getPageCopy(ROUTE, locale)

  const hero = findSection<HeroSection>(
    page.sections,
    'hero',
    'networking.hero'
  )
  const intro = findSection<CtaPanelSection>(
    page.sections,
    'ctaPanel',
    'networking.intro'
  )
  const features = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'networking.features'
  )
  const builderCta = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'networking.builderCta'
  )
  const relatedArticles = findSection<RelatedArticlesSection>(
    page.sections,
    'relatedArticles',
    'networking.relatedArticles'
  )

  const articles = await getLatestPressArticles(
    relatedArticles.visibleCount ?? 4
  )

  return (
    <>
      <NetworkingHero data={hero} backHref={ROUTES.technologyStack} />
      <NetworkingIntro data={intro} />
      <NetworkingFeatures data={features} />
      <TechStackBuilderCta
        data={builderCta}
        className="mt-15 mb-15 md:mt-25 md:mb-25"
      />
      <TechStackExplorer locale={locale} />
      <TechStackRelatedArticles data={relatedArticles} articles={articles} />
    </>
  )
}
