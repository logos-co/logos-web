import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  HeroSection,
  HomeAboutSection,
  HomeBuilderPortalSection,
  HomeChoosePathSection,
  HomeDecideSection,
  HomeSocialProofSection,
  HomeStartBuildingSection,
  HomeUseCasesSection,
  RelatedArticlesSection,
  TechStackOverviewSection,
} from '@repo/content/schemas'

import AboutSection from '@/components/sections/home/about-section'
import BuilderPortalSection from '@/components/sections/home/builder-portal-section'
import DecideSection from '@/components/sections/home/decide-section'
import FeatureCardsSection from '@/components/sections/home/feature-cards-section'
import HeroSectionView from '@/components/sections/home/hero-section'
import BlogSection from '@/components/sections/home/blog-section'
import SocialProofSection from '@/components/sections/home/social-proof-section'
import StartBuildingSection from '@/components/sections/home/start-building-section'
import TechStackSection from '@/components/sections/home/tech-stack-section'
import UseCasesSection from '@/components/sections/home/use-cases-section'

import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getLatestBlogArticles } from '@/lib/blog-engine'
import { getSocialProofStats } from '@/lib/social-proof-stats'
import { getWinnableIssuesCount } from '@/lib/winnable-issues'

const findSection = createSectionFinder('home')

const ROUTE = ROUTES.home

export const generateMetadata = createPageMetadata(ROUTE)

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`HomePage received non-active locale "${locale}"`)
  }
  const page = await getPageCopy(ROUTE, locale)

  const hero = findSection<HeroSection>(page.sections, 'hero', 'home.atf')

  const socialProof = findSection<HomeSocialProofSection>(
    page.sections,
    'homeSocialProof',
    'home.socialProof'
  )

  const techStack = findSection<TechStackOverviewSection>(
    page.sections,
    'techStackOverview',
    'home.techStack'
  )

  const paths = findSection<HomeChoosePathSection>(
    page.sections,
    'homeChoosePath',
    'home.paths'
  )

  const blog = findSection<RelatedArticlesSection>(
    page.sections,
    'relatedArticles',
    'home.blog'
  )

  const about = findSection<HomeAboutSection>(
    page.sections,
    'homeAbout',
    'home.about'
  )

  const decide = findSection<HomeDecideSection>(
    page.sections,
    'homeDecide',
    'home.decide'
  )

  const startBuilding = findSection<HomeStartBuildingSection>(
    page.sections,
    'homeStartBuilding',
    'home.startBuilding'
  )

  const useCases = findSection<HomeUseCasesSection>(
    page.sections,
    'homeUseCases',
    'home.useCases'
  )

  const builderPortal = findSection<HomeBuilderPortalSection>(
    page.sections,
    'homeBuilderPortal',
    'home.builderPortal'
  )

  const [articles, socialProofStats, winnableIssuesCount] = await Promise.all([
    getLatestBlogArticles(blog.visibleCount ?? 4),
    getSocialProofStats(),
    getWinnableIssuesCount(),
  ])

  return (
    <>
      <HeroSectionView data={hero} />
      <SocialProofSection
        data={socialProof}
        stats={socialProofStats}
        winnableIssuesCount={winnableIssuesCount}
      />
      <FeatureCardsSection data={paths} />
      <AboutSection data={about} />
      <DecideSection data={decide} />
      <UseCasesSection data={useCases} />
      <BuilderPortalSection data={builderPortal} />
      <TechStackSection
        data={techStack}
        networkingHref={ROUTES.networking}
        foundationHref={ROUTES.technologyStack}
        desktopAt1367
        bottomSpacingClassName="pb-[112px]"
        ctas={techStack.ctas}
      />
      <StartBuildingSection data={startBuilding} />
      <BlogSection data={blog} articles={articles} />
    </>
  )
}
