import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import musterPage from '../../../../content/pages/en/case-studies-muster.json'

vi.mock('@repo/content/loaders', () => ({
  getPageCopy: vi.fn(async () => musterPage),
  getAllIdeas: vi.fn(async () => []),
  getCircles: vi.fn(async () => []),
  getFieldGuideManifest: vi.fn(async () => ({})),
  flattenFieldGuideItems: vi.fn(() => []),
  getZineCatalogue: vi.fn(async () => ({ editions: [] })),
}))
vi.mock('@/lib/blog-content', () => ({
  getAllBlogArticles: vi.fn(async () => []),
  getAllBlogPodcasts: vi.fn(async () => []),
  isPublishedPost: vi.fn(() => true),
}))
vi.mock('@/lib/rfps-github', () => ({
  fetchGithubRfps: vi.fn(async () => []),
}))

const CANONICAL_ORIGIN = 'https://logos.co'
const DEPLOYMENT_ORIGIN = 'https://logos-co-web.vercel.app'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe.each(['production', 'staging'])('%s SEO origin', (mode) => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_API_MODE', mode)
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', DEPLOYMENT_ORIGIN)
    vi.stubEnv('VERCEL_URL', new URL(DEPLOYMENT_ORIGIN).host)
  })

  test('uses the public origin for Muster canonical and social metadata', async () => {
    const { createPageMetadata } = await import('../page-metadata')
    const result = await createPageMetadata(musterPage.route)({
      params: Promise.resolve({ locale: 'en' }),
    })
    const pageUrl = `${CANONICAL_ORIGIN}${musterPage.route}`
    const imageUrl = `${CANONICAL_ORIGIN}${musterPage.seo.ogImage.src}`

    expect(result.metadataBase?.origin).toBe(CANONICAL_ORIGIN)
    expect(result.alternates?.canonical).toBe(pageUrl)
    expect(result.openGraph).toMatchObject({
      url: pageUrl,
      images: [{ url: imageUrl }],
    })
    expect(result.twitter).toMatchObject({ images: [imageUrl] })
    expect(JSON.stringify(result)).not.toContain(DEPLOYMENT_ORIGIN)
  })

  test('uses the public origin for every sitemap entry', async () => {
    const sitemap = (await import('../../app/sitemap')).default
    const entries = await sitemap()

    expect(entries).toContainEqual({
      url: `${CANONICAL_ORIGIN}${musterPage.route}`,
    })
    expect(
      entries.every((entry) => new URL(entry.url).origin === CANONICAL_ORIGIN)
    ).toBe(true)
  })

  test('keeps structured data and crawler URLs on the public origin', async () => {
    const {
      createOrganizationJsonLd,
      createWebSiteJsonLd,
      createBreadcrumbListJsonLd,
    } = await import('../structured-data')
    const robots = (await import('../../app/robots')).default

    expect(createOrganizationJsonLd()).toMatchObject({
      url: CANONICAL_ORIGIN,
      logo: `${CANONICAL_ORIGIN}/apple-touch-icon.png`,
    })
    expect(createWebSiteJsonLd()).toMatchObject({ url: CANONICAL_ORIGIN })
    expect(
      createBreadcrumbListJsonLd(
        [{ name: 'Muster', path: musterPage.route }],
        'en'
      )
    ).toMatchObject({
      itemListElement: [{ item: `${CANONICAL_ORIGIN}${musterPage.route}` }],
    })
    expect(robots()).toMatchObject(
      mode === 'production'
        ? { host: CANONICAL_ORIGIN, sitemap: `${CANONICAL_ORIGIN}/sitemap.xml` }
        : { rules: { userAgent: '*', disallow: '/' } }
    )
    expect(JSON.stringify(robots())).not.toContain(DEPLOYMENT_ORIGIN)
  })
})
