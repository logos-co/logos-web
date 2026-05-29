import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  CardGridSection,
  CtaPanelSection,
  HeroSection,
  RelatedArticlesSection,
} from '@repo/content/schemas'

import StorageHero from '@/components/sections/storage/storage-hero'
import StorageAccess from '@/components/sections/storage/storage-access'
import StorageMain from '@/components/sections/storage/storage-main'
import StorageTechStack from '@/components/sections/storage/storage-tech-stack'
import StorageUseCases from '@/components/sections/storage/storage-use-cases'
import TechStackBuilderCta from '@/components/sections/shared/tech-stack-builder-cta'
import TechStackRelatedArticles from '@/components/sections/shared/tech-stack-related-articles'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getLatestPressArticles } from '@/lib/press-engine'

const ROUTE = ROUTES.storage

export const generateMetadata = createPageMetadata(ROUTE)

const findSection = createSectionFinder('storage')

/**
 * Four of five sections wired to PageCopy:
 *   - storage.hero            → StorageHero
 *   - storage.main            → StorageMain
 *   - storage.useCases        → StorageUseCases
 *   - storage.builderCta      → TechStackBuilderCta
 *   - storage.relatedArticles → TechStackRelatedArticles
 *
 * `StorageTechStack` composes the shared tech stack explorer so the card grid
 * stays aligned with `/technology-stack`.
 */
export default async function StoragePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`StoragePage received non-active locale "${locale}"`)
  }
  const page = await getPageCopy(ROUTE, locale)

  const hero = findSection<HeroSection>(page.sections, 'hero', 'storage.hero')
  const main = findSection<CtaPanelSection>(
    page.sections,
    'ctaPanel',
    'storage.main'
  )
  const useCases = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'storage.useCases'
  )
  const access = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'storage.access'
  )
  const builderCta = findSection<CardGridSection>(
    page.sections,
    'cardGrid',
    'storage.builderCta'
  )
  const relatedArticles = findSection<RelatedArticlesSection>(
    page.sections,
    'relatedArticles',
    'storage.relatedArticles'
  )

  const articles = await getLatestPressArticles(
    relatedArticles.visibleCount ?? 4
  )

  return (
    <>
      <StorageHero data={hero} backHref={ROUTES.technologyStack} />
      <StorageMain data={main} />
      <StorageAccess data={access} />
      <StorageUseCases data={useCases} />
      <TechStackBuilderCta
        data={builderCta}
        className="mt-15 mb-15 md:mt-25 md:mb-25"
      />
      <StorageTechStack locale={locale} />
      <TechStackRelatedArticles data={relatedArticles} articles={articles} />
    </>
  )
}
