import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { ROUTES } from '@/constants/routes'

import buildTheParallelContent from '../../../../content/pages/en/build-the-parallel.json' with { type: 'json' }

const publicAssetPath = (src: string) =>
  fileURLToPath(new URL(`../../public${src}`, import.meta.url))

/** Section lookups the page performs — keep this in sync with page.tsx. */
const REQUIRED_SECTIONS = [
  { componentType: 'hero', key: 'buildTheParallel.atf' },
  { componentType: 'featuredText', key: 'buildTheParallel.statement' },
  { componentType: 'ctaPanel', key: 'buildTheParallel.circlesMap' },
  { componentType: 'homeChoosePath', key: 'buildTheParallel.paths' },
] as const

describe('build the parallel page contract', () => {
  test('is registered on the canonical route', () => {
    expect(ROUTES.buildTheParallel).toBe('/build-the-parallel')
    expect(buildTheParallelContent.route).toBe(ROUTES.buildTheParallel)
  })

  test('copy provides every section the page looks up', () => {
    for (const required of REQUIRED_SECTIONS) {
      const found = buildTheParallelContent.sections.find(
        (section) =>
          section.componentType === required.componentType &&
          section.key === required.key
      )
      expect(found, `missing section ${required.key}`).toBeDefined()
    }
  })

  test('hero background is a committed public asset', () => {
    const hero = buildTheParallelContent.sections.find(
      (section) => section.componentType === 'hero'
    )
    const src = hero?.background?.src
    expect(src).toBeDefined()
    expect(existsSync(publicAssetPath(src!))).toBe(true)
  })

  test('hero uses the same-page circles map anchor', () => {
    const hero = buildTheParallelContent.sections.find(
      (section) => section.componentType === 'hero'
    )
    const anchorCta = hero?.ctas?.find((cta) => cta.href.startsWith('#'))

    expect(anchorCta?.href).toBe('#circles-map')
  })

  test('hero supporting copy has the approved desktop line breaks', () => {
    const hero = buildTheParallelContent.sections.find(
      (section) => section.componentType === 'hero'
    )

    expect(hero?.bodySecondary?.split('\n')).toEqual([
      'Logos Circles are self-organised groups solving winnable',
      'issues that matter locally, from cleanups and issue',
      'advocacy to community fundraising and beyond.',
    ])
  })
})
