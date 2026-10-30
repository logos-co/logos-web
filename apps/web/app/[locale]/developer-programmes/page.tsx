import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { Choices } from './_sections/choices'
import { Comparison } from './_sections/comparison'
import { Hero } from './_sections/hero'
import { Principles } from './_sections/principles'
import { Programmes } from './_sections/programmes'
import { Resources } from './_sections/resources'
import { Statement } from './_sections/statement'
import { programmeMono } from './fonts'
import './developer-programmes.css'
import './responsive.css'

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
  const page = await getPageCopy(ROUTES.developerProgrammes, locale)
  const copy = findSection<DeveloperProgrammesCopySection>(
    page.sections,
    'developerProgrammesCopy',
    'developerProgrammes.copy'
  )

  return (
    <div
      className={`developer-programmes text-small-compact ${programmeMono.variable}`}
    >
      <Hero copy={copy.hero} />
      <Programmes programmes={copy.programmes} />
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
