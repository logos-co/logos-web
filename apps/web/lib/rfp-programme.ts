import { cache } from 'react'
import { getPageCopy } from '@repo/content/loaders'
import type { Language, RfpProgrammeCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createSectionFinder } from '@/lib/page-sections'
import { fetchGithubRfps, type GithubRfp } from '@/lib/rfps-github'

export type RfpStatus = 'open' | 'upcoming' | 'closed'
export interface ProgrammeRfp {
  number: string
  slug: string
  title: string
  summary: string
  category: string
  tier: string
  status: RfpStatus
}

export function programmeStatus(status: string): RfpStatus {
  const value = status.toLowerCase()
  if (/reopen|upcoming|coming soon/.test(value)) return 'upcoming'
  return value === 'open' ? 'open' : 'closed'
}

export function programmeItems(items: GithubRfp[]): ProgrammeRfp[] {
  return items.map(
    ({ number, slug, title, summary, category, tier, status }) => ({
      number,
      slug,
      title,
      summary,
      category,
      tier,
      status: programmeStatus(status),
    })
  )
}

const findSection = createSectionFinder('rfp')

export const loadRfpProgramme = cache(async (locale: Language) => {
  const [page, rfps] = await Promise.all([
    getPageCopy(ROUTES.rfps, locale),
    fetchGithubRfps(),
  ])
  return {
    copy: findSection<RfpProgrammeCopySection>(
      page.sections,
      'rfpProgrammeCopy',
      'rfp.copy'
    ),
    items: programmeItems(rfps),
  }
})
