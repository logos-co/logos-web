import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, test, vi } from 'vitest'

const originalEnv = { ...process.env }

const loadStaticRedirect = async (apiMode: string | undefined) => {
  vi.resetModules()
  process.env = { ...originalEnv }
  if (apiMode === undefined) {
    delete process.env.NEXT_PUBLIC_API_MODE
  } else {
    process.env.NEXT_PUBLIC_API_MODE = apiMode
  }
  return import('../static-redirect')
}

afterEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv }
})

/** Every page that redirects instead of rendering content of its own. */
const REDIRECT_PAGES = [
  'brand-kit',
  'circles',
  'contact',
  'farewell-to-westphalia',
  'tech-stack',
  'testnet-v01-faqs',
] as const

const readPage = (route: string) =>
  readFileSync(
    fileURLToPath(new URL(`../../app/[locale]/${route}/page.tsx`, import.meta.url)),
    { encoding: 'utf8' }
  )

describe('static redirect metadata', () => {
  test('never marks a redirect source noindex in production', async () => {
    const { createRedirectMetadata } = await loadStaticRedirect('production')

    // Regression guard for the /farewell-to-westphalia incident: the stub
    // carried `noindex, nofollow`, so Google filed it under "Excluded by
    // 'noindex' tag" instead of "Page with redirect" and never forwarded its
    // ranking signals to /book — while the URL was still drawing clicks at
    // position 2.1.
    expect(createRedirectMetadata('/book').robots).toEqual({
      index: true,
      follow: true,
    })
  })

  test('keeps staging deploys out of the index', async () => {
    const { createRedirectMetadata } = await loadStaticRedirect('staging')

    expect(createRedirectMetadata('/book').robots).toEqual({
      index: false,
      follow: true,
    })
  })

  test('points the canonical at the destination, not the source', async () => {
    const { createRedirectMetadata } = await loadStaticRedirect('production')

    expect(createRedirectMetadata('/book').alternates?.canonical).toMatch(
      /\/book$/
    )
  })
})

describe('static redirect pages', () => {
  test.each(REDIRECT_PAGES)(
    '/%s redirects through the shared helper',
    (route) => {
      const source = readPage(route)

      expect(source).toContain("from '@/lib/static-redirect'")
      expect(source).toContain('createRedirectMetadata')
      expect(source).toContain('StaticRedirect')
    }
  )

  test.each(REDIRECT_PAGES)('/%s declares no robots rules of its own', (route) => {
    // The helper owns the robots envelope; a page overriding it locally is how
    // the noindex regression happened in the first place.
    expect(readPage(route)).not.toContain('robots')
  })

  test.each(REDIRECT_PAGES)(
    '/%s does not use redirect() from next/navigation',
    (route) => {
      // `redirect()` needs a server. Under `output: "export"` it builds a bare
      // 200 with no title, canonical or body — which is what /contact and
      // /circles were shipping.
      expect(readPage(route)).not.toContain("from 'next/navigation'")
    }
  )

  test('every redirect source stays out of the sitemap', () => {
    // Comments are stripped first: sitemap.ts documents *why* /contact is
    // excluded, and that prose would otherwise read as an entry.
    const sitemap = readFileSync(
      fileURLToPath(new URL('../../app/sitemap.ts', import.meta.url)),
      { encoding: 'utf8' }
    )
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')

    for (const route of REDIRECT_PAGES) {
      expect(sitemap).not.toContain(`/${route}`)
    }
    expect(sitemap).not.toContain('ROUTES.contact')
  })

  test('covers every redirect page that exists on disk', () => {
    const routes = readdirSync(
      fileURLToPath(new URL('../../app/[locale]', import.meta.url)),
      { withFileTypes: true }
    )
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => {
        try {
          return readPage(name).includes('@/lib/static-redirect')
        } catch {
          return false
        }
      })

    expect(routes.sort()).toEqual([...REDIRECT_PAGES].sort())
  })
})
