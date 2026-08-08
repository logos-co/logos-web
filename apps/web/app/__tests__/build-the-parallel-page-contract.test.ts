import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { ROUTES } from '@/constants/routes'

import buildTheParallelContent from '../../../../content/pages/en/build-the-parallel.json' with { type: 'json' }

const readPageSource = () =>
  readFileSync(
    fileURLToPath(
      new URL('../[locale]/build-the-parallel/page.tsx', import.meta.url)
    ),
    'utf8'
  )

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

  test('hero anchor CTA resolves to the circles map rendered on this page', () => {
    const hero = buildTheParallelContent.sections.find(
      (section) => section.componentType === 'hero'
    )
    const anchorCta = hero?.ctas?.find((cta) => cta.href.startsWith('#'))

    expect(anchorCta?.href).toBe('#circles-map')
    expect(readPageSource()).toContain('id="circles-map"')
  })

  test('reuses the shared hero, statement, and path-card sections', () => {
    const source = readPageSource()

    expect(source).toContain('@/components/sections/shared/hero-section')
    expect(source).toContain('@/components/sections/shared/statement-heading')
    expect(source).toContain(
      '@/components/sections/shared/feature-cards-section'
    )
    expect(source).toContain('@/components/sections/circles/circles-map')
  })
})
