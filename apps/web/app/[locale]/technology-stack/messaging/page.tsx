import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  CardGridSection,
  CtaPanelSection,
  HeroSection,
  RelatedArticlesSection,
} from '@repo/content/schemas'

import MessagingCaseStudies from '@/components/sections/messaging/messaging-case-studies'
import MessagingHero from '@/components/sections/messaging/messaging-hero'
import MessagingIntro from '@/components/sections/messaging/messaging-intro'
import MessagingTechStack from '@/components/sections/messaging/messaging-tech-stack'
import TechStackBuilderCta from '@/components/sections/shared/tech-stack-builder-cta'
import {
  TechStackDetailPage,
  TechStackDetailSection,
} from '@/components/sections/shared/tech-stack-detail-layout'
import TechStackRelatedArticles from '@/components/sections/shared/tech-stack-related-articles'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getLatestBlogArticles } from '@/lib/blog-engine'

const ROUTE = ROUTES.messaging

export const generateMetadata = createPageMetadata(ROUTE)

const findSection = createSectionFinder('messaging')

/**
 * Five of six sections wired to PageCopy:
 *   - messaging.hero            → MessagingHero
 *   - messaging.privacy + lmn + censorship
 *                              → MessagingIntro
 *   - messaging.caseStudies     → MessagingCaseStudies
 *   - messaging.builderCta      → TechStackBuilderCta
 *   - messaging.relatedArticles → TechStackRelatedArticles
 *
 * `MessagingTechStack` composes the shared tech stack explorer so the card
 * grid stays aligned with `/technology-stack`.
 */
export default async function MessagingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`MessagingPage received non-active locale "${locale}"`)
  }
  const page = await getPageCopy(ROUTE, locale)

  const hero = findSection<HeroSection>(page.sections, 'hero', 'messaging.hero')
  const privacy = findSection<CtaPanelSection>(
    page.sections,
    'ctaPanel',
    'messaging.privacy'
  )
  const lmn = findSection<CtaPanelSection>(
    page.sections,
    'ctaPanel',
    'messaging.lmn'
  )
  const censorship = findSection<CtaPanelSection>(
    page.sections,
    'ctaPanel',
    'messaging.censorship'
  )
  const caseStudies = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'messaging.caseStudies'
  )
  const builderCta = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'messaging.builderCta'
  )
  const relatedArticles = findSection<RelatedArticlesSection>(
    page.sections,
    'relatedArticles',
    'messaging.relatedArticles'
  )

  const articles = await getLatestBlogArticles(
    relatedArticles.visibleCount ?? 4
  )

  return (
    <TechStackDetailPage>
      <MessagingHero data={hero} backHref={ROUTES.technologyStack} />
      <TechStackDetailSection>
        <MessagingIntro privacy={privacy} lmn={lmn} censorship={censorship} />
      </TechStackDetailSection>
      <TechStackDetailSection>
        <MessagingCaseStudies data={caseStudies} />
      </TechStackDetailSection>
      <TechStackDetailSection>
        <TechStackBuilderCta data={builderCta} />
      </TechStackDetailSection>
      <TechStackDetailSection className="mt-5 md:mt-25">
        <MessagingTechStack locale={locale} />
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
