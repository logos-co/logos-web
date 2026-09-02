import { afterEach, describe, expect, test, vi } from 'vitest'

const originalEnv = { ...process.env }

const loadWithApiMode = async (apiMode: string) => {
  vi.resetModules()
  process.env = { ...originalEnv, NEXT_PUBLIC_API_MODE: apiMode }
  return {
    robots: (await import('../../app/robots')).default,
    metadata: await import('../metadata'),
  }
}

afterEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv }
})

describe('robots.txt', () => {
  test('invites crawlers and advertises the sitemap in production', async () => {
    const { robots } = await loadWithApiMode('production')
    const result = robots()

    expect(result.rules).toMatchObject({ userAgent: '*', allow: '/' })
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
  })

  test.each(['staging', 'development'])(
    'closes %s to crawlers and withholds the sitemap',
    async (mode) => {
      const { robots } = await loadWithApiMode(mode)
      const result = robots()

      // dev.logos.co builds the same pages from the same content, so leaving
      // it crawlable makes it a near-complete duplicate of production.
      expect(result.rules).toMatchObject({ userAgent: '*', disallow: '/' })
      expect(result.sitemap).toBeUndefined()
    }
  )
})

describe('default metadata envelope', () => {
  test('falls back to the site title and description across every channel', async () => {
    const { metadata } = await loadWithApiMode('production')
    const result = await metadata.createDefaultMetadata({ locale: 'en' })

    // A page that omits both fields used to ship empty Twitter tags and an
    // empty OG image alt, because those read the raw arguments rather than the
    // resolved fallbacks.
    expect(result.twitter).toMatchObject({
      title: result.title,
      description: result.description,
    })

    const [ogImage] = (result.openGraph as { images: { alt: string }[] }).images
    expect(ogImage.alt).toBe(result.title)
    expect(ogImage.alt).not.toBe('')
  })

  test('keeps explicit page values when they are given', async () => {
    const { metadata } = await loadWithApiMode('production')
    const result = await metadata.createDefaultMetadata({
      locale: 'en',
      title: 'Basecamp',
      description: 'Run a node from your desktop.',
    })

    expect(result.twitter).toMatchObject({
      title: 'Basecamp',
      description: 'Run a node from your desktop.',
    })
  })
})
