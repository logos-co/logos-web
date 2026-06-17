import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'
import {
  resolveBasecampInstallCtaHref,
  resolveBasecampInstallCtaLinkProps,
} from '@/lib/basecamp-release-links'

import buildersHubResources from '../../../../content/builders-hub/resources/en.json' with { type: 'json' }
import buildersHubSettings from '../../../../content/builders-hub/settings/en.json' with { type: 'json' }
import homePage from '../../../../content/pages/en/home.json' with { type: 'json' }
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
const onboardingCalendarHref = 'https://cal.com/team/logos-onboarding/intro'
const logosDocsHref = 'https://github.com/logos-co/logos-docs'
const communityIdeasHref = 'https://github.com/logos-co/ideas'
const parallelSocietyHref = 'https://ps.logos.co/'
const basecampReleaseHref =
  'https://github.com/logos-co/logos-basecamp/releases/tag/0.1.2'
const basecampLinuxDownloadHref =
  'https://github.com/logos-co/logos-basecamp/releases/download/0.1.2/LogosBasecamp-Desktop-v0.1.2-2576ef-aarch64.AppImage'
const basecampMacDownloadHref =
  'https://github.com/logos-co/logos-basecamp/releases/download/0.1.2/LogosBasecamp-Desktop-v0.1.2-2576ef-aarch64.dmg'
const runNodeCliDocsHref =
  'https://github.com/logos-co/logos-docs/blob/main/docs/blockchain/get-started/run-a-logos-blockchain-node-from-cli.md'
const docsLabels = new Set(['docs', 'documentation', 'view the docs'])
const routeUsageAllowlist = new Set([
  'apps/web/app/[locale]/work-with-us/page.tsx',
  'apps/web/app/sitemap.ts',
  'apps/web/constants/routes.ts',
  'apps/web/lib/__tests__/link-policy.test.ts',
])

const collectDocsLinks = (
  value: unknown
): Array<{ label: string; href: string }> => {
  if (Array.isArray(value)) {
    return value.flatMap(collectDocsLinks)
  }

  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>
  const docsText =
    typeof record.label === 'string' &&
    docsLabels.has(record.label.toLowerCase())
      ? record.label
      : typeof record.title === 'string' &&
          docsLabels.has(record.title.toLowerCase())
        ? record.title
        : null
  const ownLink =
    docsText && typeof record.href === 'string'
      ? [{ label: docsText, href: record.href }]
      : []

  return ownLink.concat(
    Object.values(record).flatMap((child) => collectDocsLinks(child))
  )
}

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
    // Labels are copy and can change; assert on the route the card links to.
    const allCards = navigation.menuPanels.flatMap(
      (panel) => panel.cardSections?.flatMap((section) => section.cards) ?? []
    )

    expect(ROUTES.research).toBe('/research')
    expect(allCards.some((card) => card.href === ROUTES.research)).toBe(true)
  })

  it('lists the core Research panel resources links', () => {
    const researchPanel = navigation.menuPanels.find(
      (panel) => panel.label === 'Research'
    )
    const resourcesSection = researchPanel?.textSections?.find(
      (section) => section.label === 'Resources'
    )

    // Labels/links here are copy and can change (e.g. Book may come and go);
    // assert the stable core links are present rather than pinning the exact list.
    expect(resourcesSection?.links).toEqual(
      expect.arrayContaining([
        { label: 'Specs / RFC', href: 'https://lip.logos.co/' },
        {
          label: 'Research Forum',
          href: 'https://forum.research.logos.co/',
        },
      ])
    )
  })

  it('routes the Builders Hub RFP programme panel to the RFP listing', () => {
    expect(buildersHubSettings.programs?.rfpsHref).toBe(ROUTES.rfps)
  })

  it('routes the Basecamp prepare cards to their external resources', () => {
    const prepareCtas =
      buildersHubSettings.prepare?.cards.flatMap((card) => card.ctas) ?? []

    expect(prepareCtas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: basecampReleaseHref,
          external: true,
        }),
        expect.objectContaining({
          href: runNodeCliDocsHref,
          external: true,
        }),
      ])
    )
  })

  it('routes homepage builder support cards to their external repositories', () => {
    const startBuildingSection = readFileSync(
      join(webRoot, 'components/sections/home/start-building-section.tsx'),
      'utf8'
    )

    expect(EXTERNAL_URLS.communityIdeas).toBe(communityIdeasHref)
    expect(EXTERNAL_URLS.docs).toBe(logosDocsHref)
    expect(startBuildingSection).toContain('EXTERNAL_URLS.communityIdeas')
    expect(startBuildingSection).toContain('EXTERNAL_URLS.docs')
    expect(startBuildingSection).not.toContain(
      "{ title: t('ideas'), href: ROUTES.ideas"
    )
  })

  it('routes the Logos Media navigation card to Blog', () => {
    // Section and card labels are copy; assert a navigation card links to Blog.
    const allCards = navigation.menuPanels.flatMap(
      (panel) => panel.cardSections?.flatMap((section) => section.cards) ?? []
    )

    expect(allCards.some((card) => card.href === ROUTES.media)).toBe(true)
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
    // Labels are copy; assert each surface links to the jobs board by href.
    expect(footer.mainLinks).toContainEqual(
      expect.objectContaining({
        href: jobsHref,
        external: true,
      })
    )

    const allNavLinks = navigation.menuPanels.flatMap(
      (panel) => panel.textSections?.flatMap((section) => section.links) ?? []
    )

    expect(allNavLinks.some((link) => link.href === jobsHref)).toBe(true)

    const overviewCtas = buildersHubSettings.overviewLinks.map(
      (link) => link.primaryCta
    )

    expect(overviewCtas).toContainEqual(
      expect.objectContaining({
        href: jobsHref,
        external: true,
      })
    )
  })

  it('routes the Builders Hub onboarding support CTA to the calendar', () => {
    // Card title is copy; assert a support CTA links to the calendar by href.
    const supportCtas = buildersHubSettings.support.cards.map(
      (card) => card.cta
    )

    expect(supportCtas).toContainEqual(
      expect.objectContaining({
        href: onboardingCalendarHref,
        external: true,
      })
    )
  })

  it('routes the homepage Parallel Society CTA to the event site', () => {
    const parallelSocietyHeadline = homePage.sections.find(
      (section) => section.key === 'home.parallelSocietyHeadline'
    )

    // The CTA label is copy; assert the route and external flag only.
    expect(parallelSocietyHeadline).toEqual(
      expect.objectContaining({
        cta: expect.objectContaining({
          href: parallelSocietyHref,
          external: true,
        }),
      })
    )
  })

  it('routes Docs and Documentation links to the Logos docs repository', () => {
    const contentDocsLinks = [
      footer,
      navigation,
      buildersHubResources,
      buildersHubSettings,
      ...readdirSync(join(repoRoot, 'content/pages/en'))
        .filter((entry) => entry.endsWith('.json'))
        .map((entry) =>
          JSON.parse(
            readFileSync(join(repoRoot, 'content/pages/en', entry), 'utf8')
          )
        ),
    ].flatMap(collectDocsLinks)

    expect(EXTERNAL_URLS.docs).toBe(logosDocsHref)
    expect(contentDocsLinks.length).toBeGreaterThan(0)
    for (const link of contentDocsLinks) {
      expect(link.href).toMatch(/^https:\/\/github\.com\/logos[\w-]*\//)
    }
  })

  it('routes Basecamp install CTAs through the shared release URLs', () => {
    expect(EXTERNAL_URLS.basecampRelease).toBe(basecampReleaseHref)
    expect(EXTERNAL_URLS.basecampLinuxDownload).toBe(basecampLinuxDownloadHref)
    expect(EXTERNAL_URLS.basecampMacDownload).toBe(basecampMacDownloadHref)

    expect(
      resolveBasecampInstallCtaHref({
        label: 'Install',
        href: ROUTES.basecamp,
        iconOverride: 'download',
      })
    ).toBe(basecampReleaseHref)
    expect(
      resolveBasecampInstallCtaHref({
        label: 'Install testnet v0.1',
        href: ROUTES.buildersHub,
        iconOverride: 'download',
      })
    ).toBe(basecampReleaseHref)
    expect(
      resolveBasecampInstallCtaHref({
        label: 'Install Linux',
        href: ROUTES.getStarted,
        iconOverride: 'download',
      })
    ).toBe(basecampLinuxDownloadHref)
    expect(
      resolveBasecampInstallCtaHref({
        label: 'Install Mac',
        href: ROUTES.getStarted,
        iconOverride: 'download',
      })
    ).toBe(basecampMacDownloadHref)
    expect(
      resolveBasecampInstallCtaLinkProps({
        label: 'Install',
        href: ROUTES.basecamp,
        iconOverride: 'download',
      })
    ).toEqual({
      href: basecampReleaseHref,
      target: '_blank',
      rel: 'noopener noreferrer',
    })
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
