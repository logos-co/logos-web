import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  CardGridSection,
  CtaPanelSection,
  HeroSection,
  RelatedArticlesSection,
} from '@repo/content/schemas'

import BlockchainCryptarchia from '@/components/sections/blockchain/blockchain-cryptarchia'
import BlockchainHero from '@/components/sections/blockchain/blockchain-hero'
import BlockchainPrivacy from '@/components/sections/blockchain/blockchain-privacy'
import TechStackBuilderCta from '@/components/sections/shared/tech-stack-builder-cta'
import TechStackExplorer from '@/components/sections/shared/tech-stack-explorer'
import TechStackRelatedArticles from '@/components/sections/shared/tech-stack-related-articles'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getLatestPressArticles } from '@/lib/press-engine'

const ROUTE = ROUTES.blockchain

export const generateMetadata = createPageMetadata(ROUTE)

const findSection = createSectionFinder('blockchain')

export default async function BlockchainPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`BlockchainPage received non-active locale "${locale}"`)
  }
  const page = await getPageCopy(ROUTE, locale)

  const hero = findSection<HeroSection>(
    page.sections,
    'hero',
    'blockchain.hero'
  )
  const privacy = findSection<CtaPanelSection>(
    page.sections,
    'ctaPanel',
    'blockchain.privacy'
  )
  const cryptarchia = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'blockchain.cryptarchia'
  )
  const builderCta = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'blockchain.builderCta'
  )
  const relatedArticles = findSection<RelatedArticlesSection>(
    page.sections,
    'relatedArticles',
    'blockchain.relatedArticles'
  )

  const articles = await getLatestPressArticles(
    relatedArticles.visibleCount ?? 4
  )

  return (
    <div className="mx-auto max-w-[1440px]">
      <BlockchainHero data={hero} backHref={ROUTES.technologyStack} />
      <BlockchainPrivacy data={privacy} />
      <BlockchainCryptarchia data={cryptarchia} />
      <TechStackBuilderCta data={builderCta} />
      <TechStackRelatedArticles
        data={relatedArticles}
        articles={articles}
        sectionClassName="mt-0 pt-15 pb-15 md:mt-0 md:pt-[87px] md:pb-[93px]"
      />
      <TechStackExplorer locale={locale} />
    </div>
  )
}
