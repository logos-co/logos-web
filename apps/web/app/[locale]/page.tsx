import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  FeaturedTextSection,
  GallerySection,
  HeroSection,
  RelatedArticlesSection,
  TechStackOverviewSection,
} from '@repo/content/schemas'

import AboutSection from '@/components/sections/home/about-section'
import BuilderPortalSection from '@/components/sections/home/builder-portal-section'
import CirclesCtaSection from '@/components/sections/home/circles-cta-section'
import FeatureCardsSection from '@/components/sections/home/feature-cards-section'
import HeroSectionView from '@/components/sections/home/hero-section'
import ParallelSocietySection from '@/components/sections/home/parallel-society-section'
import BlogSection from '@/components/sections/home/blog-section'
import SocialProofSection from '@/components/sections/home/social-proof-section'
import StartBuildingSection from '@/components/sections/home/start-building-section'
import TechStackSection from '@/components/sections/home/tech-stack-section'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getLatestBlogArticles } from '@/lib/blog-engine'
import { getSocialProofStats } from '@/lib/social-proof-stats'

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

  const techStack = findSection<TechStackOverviewSection>(
    page.sections,
    'techStackOverview',
    'home.techStack'
  )

  const parallelSocietyHeadline = findSection<FeaturedTextSection>(
    page.sections,
    'featuredText',
    'home.parallelSocietyHeadline'
  )

  const parallelSocietyGallery = findSection<GallerySection>(
    page.sections,
    'gallery',
    'home.parallelSociety'
  )

  const blog = findSection<RelatedArticlesSection>(
    page.sections,
    'relatedArticles',
    'home.blog'
  )

  const circlesCta = findSection<FeaturedTextSection>(
    page.sections,
    'featuredText',
    'home.circlesCta'
  )

  const [articles, socialProofStats] = await Promise.all([
    getLatestBlogArticles(blog.visibleCount ?? 4),
    getSocialProofStats(),
  ])

  return (
    <>
      <HeroSectionView data={hero} />
      <SocialProofSection stats={socialProofStats} />
      <AboutSection locale={locale} />
      <BuilderPortalSection locale={locale} />
      <FeatureCardsSection />
      <TechStackSection
        data={techStack}
        networkingHref={ROUTES.networking}
        foundationHref={ROUTES.technologyStack}
        desktopAt1367
      />
      <StartBuildingSection locale={locale} />
      <CirclesCtaSection data={circlesCta} />
      <ParallelSocietySection
        headline={parallelSocietyHeadline}
        gallery={parallelSocietyGallery}
      />
      <BlogSection data={blog} articles={articles} />
    </>
  )
}
