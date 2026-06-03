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
import {
  TechStackDetailPage,
  TechStackDetailSection,
} from '@/components/sections/shared/tech-stack-detail-layout'
import TechStackRelatedArticles from '@/components/sections/shared/tech-stack-related-articles'
import NetworkingTechStack from '@/components/sections/networking/networking-tech-stack'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getLatestBlogArticles } from '@/lib/blog-engine'
import { TECH_STACK_RELATED_ARTICLE_TAGS } from '@/lib/tech-stack-related-articles'

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

  const articles = await getLatestBlogArticles(
    relatedArticles.visibleCount ?? 4,
    TECH_STACK_RELATED_ARTICLE_TAGS.networking
  )

  return (
    <TechStackDetailPage>
      <NetworkingHero data={hero} backHref={ROUTES.technologyStack} />
      <TechStackDetailSection>
        <NetworkingIntro data={intro} />
      </TechStackDetailSection>
      <TechStackDetailSection>
        <NetworkingFeatures data={features} />
      </TechStackDetailSection>
      <TechStackDetailSection>
        <TechStackBuilderCta data={builderCta} />
      </TechStackDetailSection>
      <TechStackDetailSection>
        <NetworkingTechStack locale={locale} />
      </TechStackDetailSection>
      <TechStackDetailSection className="mt-0 md:mt-25">
        <TechStackRelatedArticles
          data={relatedArticles}
          articles={articles}
          sectionClassName="mt-0 mb-0 md:mt-0 md:mb-0"
        />
      </TechStackDetailSection>
    </TechStackDetailPage>
  )
}
