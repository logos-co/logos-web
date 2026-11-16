import { getTranslations } from 'next-intl/server'
import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { loadLambdaProgramme } from '@/lib/lambda-programme'
import { loadRfpProgramme } from '@/lib/rfp-programme'
import { programmeSummaries } from '@/lib/programme-summaries'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { Choices } from './_sections/choices'
import { Comparison } from './_sections/comparison'
import { Hero } from './_sections/hero'
import { Principles } from './_sections/principles'
import { MobileProgrammes } from './_sections/mobile-programmes'
import { MobileComparison } from './_sections/mobile-comparison'
import { Programmes } from './_sections/programmes'
import { Resources } from './_sections/resources'
import { Statement } from './_sections/statement'
import { programmeMono } from './fonts'
import './developer-programmes.css'
import './responsive.css'
import './mobile.css'

interface PageProps {
  params: Promise<{ locale: string }>
}

export const generateMetadata = createPageMetadata(ROUTES.developerProgrammes)
const findSection = createSectionFinder('developer-programmes')

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(
      `DeveloperProgrammesPage received non-active locale "${locale}"`
    )
  }
  const [page, rfp, prizes, t] = await Promise.all([
    getPageCopy(ROUTES.developerProgrammes, locale),
    loadRfpProgramme(locale),
    loadLambdaProgramme(locale),
    getTranslations({ locale, namespace: 'programmeData' }),
  ])
  const copy = findSection<DeveloperProgrammesCopySection>(
    page.sections,
    'developerProgrammesCopy',
    'developerProgrammes.copy'
  )

  const summaries = programmeSummaries(
    copy.programmes,
    { items: rfp.items, statuses: rfp.copy.listing.statuses },
    prizes,
    t('availability', { count: prizes.openCards.length })
  )

  return (
    <div
      className={`developer-programmes text-small-compact ${programmeMono.variable}`}
    >
      <Hero copy={copy.hero} />
      <Programmes programmes={summaries} />
      <MobileProgrammes programmes={summaries} mobile={copy.mobile} />
      <MobileComparison
        programmes={copy.programmes}
        heading={copy.comparisonHeading}
      />
      <Comparison
        heading={copy.comparisonHeading}
        programmes={copy.programmes}
      />
      <Choices
        heading={copy.choiceHeading}
        programmes={copy.programmes}
        help={copy.choiceHelp}
      />
      <Principles copy={copy.principles} />
      <Statement copy={copy.statement} programmes={copy.programmes} />
      <Resources copy={copy.resources} />
    </div>
  )
}
