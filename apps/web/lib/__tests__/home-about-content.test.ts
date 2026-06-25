import { getPageCopy } from '@repo/content/loaders'
import type { HomeAboutSection } from '@repo/content/schemas'
import { describe, expect, it } from 'vitest'

import { ROUTES } from '@/constants/routes'
import { createSectionFinder } from '@/lib/page-sections'

describe('homepage about content', () => {
  it('keeps every about problem populated', async () => {
    const page = await getPageCopy(ROUTES.home, 'en')
    const about = createSectionFinder('home')<HomeAboutSection>(
      page.sections,
      'homeAbout',
      'home.about'
    )
    for (const problem of Object.values(about.problems)) {
      expect(problem.title.trim().length).toBeGreaterThan(0)
      expect(problem.facts.length).toBeGreaterThan(0)
    }
  })
})
