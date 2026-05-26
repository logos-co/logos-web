import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ROUTES } from '@/constants/routes'

import buildersHubSettings from '../../../../content/builders-hub/settings/en.json' with { type: 'json' }
import footer from '../../../../content/site/en/footer.json' with { type: 'json' }
import navigation from '../../../../content/site/en/navigation.json' with { type: 'json' }

const repoRoot = join(__dirname, '../../../..')
const webRoot = join(repoRoot, 'apps/web')
const scannedRoots = ['apps/web', 'content', 'packages/content'].map((root) =>
  join(repoRoot, root)
)
const blockedPatterns = [
  /href=["']#["']/,
  /href:\s*["']#["']/,
  /\?\?\s*["']#["']/,
  /\|\|\s*["']#["']/,
  /https:\/\/forum\.vac\.dev/,
  /https:\/\/logos\.co\/app/,
  /https:\/\/logos\.co\/office-hours/,
  /https:\/\/github\.com\/logos-co\/boilerplates/,
]
const blockedPressResolver = ['resolve', 'Press', 'List'].join('')
const skippedDirectories = new Set(['.next', 'node_modules', 'out'])
const repoPressArticlePaths = [
  'content/press',
  'packages/content/src/loaders/press.ts',
  'packages/content/src/schemas/press.ts',
].map((path) => join(repoRoot, path))
const jobsHref = 'https://free.technology/jobs'
const routeUsageAllowlist = new Set([
  'apps/web/app/[locale]/work-with-us/page.tsx',
  'apps/web/app/sitemap.ts',
  'apps/web/constants/routes.ts',
  'apps/web/lib/__tests__/link-policy.test.ts',
])

const collectTextFiles = (dir: string): string[] => {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      return skippedDirectories.has(entry) ? [] : collectTextFiles(path)
    }
    if (!/\.(json|ts|tsx)$/.test(path)) return []
    return [path]
  })
}

describe('link policy', () => {
  it('routes Research navigation cards to the Research page', () => {
    const researchPanel = navigation.menuPanels.find(
      (panel) => panel.label === 'Research'
    )
    const researchCards =
      researchPanel?.cardSections.flatMap((section) => section.cards) ?? []

    expect(ROUTES.research).toBe('/research')
    expect(researchCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Research Hub',
          href: ROUTES.research,
        }),
        expect.objectContaining({
          label: 'R&D Service Units',
          href: ROUTES.research,
        }),
      ])
    )
  })

  it('routes the Logos Press Engine navigation card to Press', () => {
    const aboutSection = navigation.menuPanels
      .flatMap((panel) => panel.cardSections ?? [])
      .find((section) => section.label === 'About')
    const aboutCards = aboutSection?.cards ?? []

    expect(aboutCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Logos Press Engine',
          href: ROUTES.press,
        }),
      ])
    )
  })

  it('does not ship placeholder or known-broken links', () => {
    const offenders = scannedRoots.flatMap(collectTextFiles).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return blockedPatterns
        .filter((pattern) => pattern.test(text))
        .map((pattern) => `${relative(repoRoot, file)} matched ${pattern}`)
    })

    expect(offenders).toEqual([])
  })

  it('routes jobs CTAs to the IFT jobs board as external links', () => {
    expect(footer.mainLinks).toContainEqual(
      expect.objectContaining({
        label: 'Work With Us',
        href: jobsHref,
        external: true,
      })
    )

    const exploreLinks =
      navigation.menuPanels
        .find((panel) => panel.label === 'Explore')
        ?.textSections.flatMap((section) => section.links) ?? []

    expect(exploreLinks).toContainEqual(
      expect.objectContaining({
        label: 'Contact Us',
        href: jobsHref,
      })
    )

    const supportCtas = buildersHubSettings.support.cards.map(
      (card) => card.cta
    )
    const overviewCtas = buildersHubSettings.overviewLinks.map(
      (link) => link.primaryCta
    )

    expect(supportCtas).toContainEqual(
      expect.objectContaining({
        href: jobsHref,
        external: true,
      })
    )
    expect(overviewCtas).toContainEqual(
      expect.objectContaining({
        href: jobsHref,
        external: true,
      })
    )
  })

  it('does not use the retired Work With Us route for public CTAs', () => {
    const offenders = scannedRoots.flatMap(collectTextFiles).flatMap((file) => {
      const relativePath = relative(repoRoot, file)
      if (routeUsageAllowlist.has(relativePath)) return []

      const text = readFileSync(file, 'utf8')
      return text.includes('/work-with-us') || text.includes('ROUTES.workWithUs')
        ? [`${relativePath} links to the retired Work With Us route`]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('does not resolve stale repo press fixtures in public web surfaces', () => {
    const offenders = collectTextFiles(webRoot).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return text.includes(blockedPressResolver)
        ? [`${relative(repoRoot, file)} resolved repo press fixtures`]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('does not keep repo-owned Press article fixtures or loaders', () => {
    const existingPaths = repoPressArticlePaths
      .filter((path) => existsSync(path))
      .map((path) => relative(repoRoot, path))

    expect(existingPaths).toEqual([])
  })
})
