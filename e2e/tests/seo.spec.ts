import { SITEMAP_SAMPLE, siteEnvironment } from '@config/site'
import { expect, test } from '@fixtures/site.fixture'

import type { APIRequestContext } from '@playwright/test'

/** Spread `size` picks over the whole list so every section gets a look. */
function sample<T>(items: T[], size: string): T[] {
  if (size === 'all') return items
  const count = Math.min(Number(size), items.length)
  const step = items.length / count
  return Array.from({ length: count }, (_, i) => items[Math.floor(i * step)]!)
}

/** GET that waits out nginx's per-IP rate limit (503) instead of failing. */
async function getStatus(request: APIRequestContext, path: string) {
  for (let attempt = 0; ; attempt++) {
    const response = await request.get(path)
    if (response.status() !== 503 || attempt === 3) return response.status()
    await new Promise((resolve) => setTimeout(resolve, 3_000))
  }
}

test.describe('logos.co crawler files', () => {
  test('robots.txt matches the environment', async ({ request, baseURL }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    const body = await response.text()

    const environment = siteEnvironment(baseURL!)
    if (environment === 'production') {
      expect(body).toMatch(/^Allow: \/$/m)
      expect(body).toMatch(/^Sitemap: https:\/\/logos\.co\/sitemap\.xml$/m)
    } else if (environment === 'staging') {
      expect(body).toMatch(/^Disallow: \/$/m)
    }
  })

  test('sitemap entries answer 200', async ({ request }) => {
    test.setTimeout(SITEMAP_SAMPLE === 'all' ? 600_000 : 180_000)

    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const xml = await response.text()

    // Request each entry's path on the site under test, whatever host the
    // build wrote into the sitemap.
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, loc]) => new URL(loc!).pathname
    )
    expect(paths.length).toBeGreaterThan(10)

    // One at a time: the deployed sites rate-limit per IP.
    const failures: string[] = []
    for (const path of sample(paths, SITEMAP_SAMPLE)) {
      const status = await getStatus(request, path)
      if (status !== 200) failures.push(`${status} ${path}`)
    }

    expect(failures, 'sitemap entries that did not answer 200').toEqual([])
  })
})
