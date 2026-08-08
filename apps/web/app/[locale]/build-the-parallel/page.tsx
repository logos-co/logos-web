import Image from 'next/image'

import { getCirclesSettings, getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  CtaPanelSection,
  FeaturedTextSection,
  HeroSection,
  HomeChoosePathSection,
} from '@repo/content/schemas'

import CirclesMap from '@/components/sections/circles/circles-map'
import { CenterCtaSection } from '@/components/sections/shared/center-cta-section'
import FeatureCardsSection from '@/components/sections/shared/feature-cards-section'
import HeroSectionView from '@/components/sections/shared/hero-section'
import StatementHeading from '@/components/sections/shared/statement-heading'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import {
  getActiveCircleMarkers,
  getUpcomingCircleEvents,
} from '@/lib/active-circles'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.buildTheParallel

const findSection = createSectionFinder('build-the-parallel')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function BuildTheParallelPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(
      `BuildTheParallelPage received non-active locale "${locale}"`
    )
  }

  const [page, circlesSettings, mapMarkers, upcomingEvents] = await Promise.all(
    [
      getPageCopy(ROUTE, locale),
      getCirclesSettings(locale),
      getActiveCircleMarkers(),
      getUpcomingCircleEvents(Infinity),
    ]
  )

  const hero = findSection<HeroSection>(
    page.sections,
    'hero',
    'buildTheParallel.atf'
  )

  const statement = findSection<FeaturedTextSection>(
    page.sections,
    'featuredText',
    'buildTheParallel.statement'
  )

  const circlesMap = findSection<CtaPanelSection>(
    page.sections,
    'ctaPanel',
    'buildTheParallel.circlesMap'
  )

  const paths = findSection<HomeChoosePathSection>(
    page.sections,
    'homeChoosePath',
    'buildTheParallel.paths'
  )

  return (
    <>
      <HeroSectionView
        data={hero}
        background={
          hero.background ? (
            <Image
              src={hero.background.src}
              alt={hero.background.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-70"
            />
          ) : undefined
        }
      />

      <section className="relative z-[2] -mt-[60px] overflow-hidden rounded-t-[36px] bg-brand-off-white">
        <div className="mx-auto max-w-[1440px] px-3">
          <div className="flex flex-col items-center gap-6 pt-[112px] pb-[112px] text-center md:gap-9 md:pt-[72px] md:pb-[64px] lg:pt-[112px] lg:pb-[102px]">
            <StatementHeading
              headline={statement.title.highlight}
              headlineMuted={statement.title.rest}
            />
            <div className="flex flex-wrap items-baseline justify-center gap-3">
              {statement.cta ? (
                <Button
                  href={statement.cta.href}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                >
                  {statement.cta.label}
                </Button>
              ) : null}
              {statement.secondaryCta ? (
                <Button
                  href={statement.secondaryCta.href}
                  variant="secondary"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                >
                  {statement.secondaryCta.label}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div id="circles-map" className="border-y border-gray-01">
        <CenterCtaSection
          title={circlesMap.title}
          body={circlesMap.description ?? ''}
        />
        <CirclesMap
          settings={circlesSettings}
          markers={mapMarkers}
          upcomingEvents={upcomingEvents}
          locale={locale}
        />
      </div>

      <FeatureCardsSection data={paths} />
    </>
  )
}
