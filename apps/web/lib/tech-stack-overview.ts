import { getPageCopy } from '@repo/content/loaders'
import type { Language, TechStackOverviewSection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'

import { createSectionFinder } from './page-sections'

const findHomeSection = createSectionFinder('home')

export async function getHomeTechStackOverview(
  locale: Language
): Promise<TechStackOverviewSection> {
  const homePage = await getPageCopy(ROUTES.home, locale)

  return findHomeSection<TechStackOverviewSection>(
    homePage.sections,
    'techStackOverview',
    'home.techStack'
  )
}
