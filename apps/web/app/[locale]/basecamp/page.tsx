import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { BasecampRenewalSection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { Hero } from './_sections/hero'
import { Subnavigation } from './_sections/subnavigation'
import { About } from './_sections/about'
import { HowItWorks } from './_sections/how-it-works'
import { LocalFirst } from './_sections/local-first'
import { RunANode } from './_sections/run-a-node'
import { Apps } from './_sections/apps'
import { Build } from './_sections/build'
import { GetStarted } from './_sections/get-started'
import './basecamp-renewal.css'

const ROUTE = ROUTES.basecamp
export const generateMetadata = createPageMetadata(ROUTE)
const findSection = createSectionFinder('basecamp')

export default async function BasecampRoutePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale))
    throw new Error(`BasecampRoutePage received non-active locale "${locale}"`)
  const page = await getPageCopy(ROUTE, locale)
  const section = findSection<BasecampRenewalSection>(
    page.sections,
    'basecampRenewal',
    'basecamp.renewal'
  )
  return (
    <div className="basecamp-renewal">
      <Hero copy={section.hero} />
      <Subnavigation copy={section.subnav} />
      <About copy={section.about} />
      <HowItWorks copy={section.how} />
      <LocalFirst copy={section.local} />
      <RunANode copy={section.run} />
      <Apps copy={section.apps} />
      <Build copy={section.build} />
      <GetStarted copy={section.started} />
    </div>
  )
}
