import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  BasecampRenewalSection,
  RoadmapCopySection,
} from '@repo/content/schemas'

import basecampRelease from '@/lib/data/basecamp-release.snapshot.json' with { type: 'json' }

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
import { resolveVersionBadges } from './_sections/version-badges'
import './basecamp-renewal.css'

const ROUTE = ROUTES.basecamp
export const generateMetadata = createPageMetadata(ROUTE)
const findSection = createSectionFinder('basecamp')
const findRoadmapSection = createSectionFinder('roadmap')

export default async function BasecampRoutePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale))
    throw new Error(`BasecampRoutePage received non-active locale "${locale}"`)
  const [page, roadmapPage] = await Promise.all([
    getPageCopy(ROUTE, locale),
    getPageCopy(ROUTES.roadmap, locale),
  ])
  const section = findSection<BasecampRenewalSection>(
    page.sections,
    'basecampRenewal',
    'basecamp.renewal'
  )
  const roadmap = findRoadmapSection<RoadmapCopySection>(
    roadmapPage.sections,
    'roadmapCopy',
    'roadmap.copy'
  )
  const badges = resolveVersionBadges(
    section.hero.badges,
    basecampRelease.tag,
    roadmap.release.activeTab
  )
  return (
    <div className="basecamp-renewal">
      <Hero copy={section.hero} badges={badges} releaseTag={basecampRelease.tag} />
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
