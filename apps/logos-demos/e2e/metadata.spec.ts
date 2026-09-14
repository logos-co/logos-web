/**
 * The things every page needs before it is shared or indexed.
 *
 * Easy to get right once and lose silently later: a page that declares its own
 * `openGraph` replaces the layout's outright, so a demo can quietly stop
 * carrying a card image without anything failing.
 */
import { expect, test, type Page } from '@playwright/test'

import { DEMOS } from '../src/demos/registry'
import { SITE_NAME, SITE_URL } from '../src/lib/site'

const meta = (page: Page, selector: string) =>
  page.locator(`meta[${selector}]`).getAttribute('content')

test.describe('site metadata', () => {
  test('the overview describes the site', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(SITE_NAME)
    expect(await meta(page, 'name="description"')).toBeTruthy()
    expect(await meta(page, 'name="theme-color"')).toBe('#152521')
    // Next normalises the root canonical without a trailing slash.
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      SITE_URL
    )
  })

  test('an icon and an apple touch icon are served', async ({ page }) => {
    await page.goto('/')

    for (const rel of ['icon', 'apple-touch-icon']) {
      const href = await page.locator(`link[rel="${rel}"]`).getAttribute('href')
      expect(href, `no ${rel}`).toBeTruthy()
      expect((await page.request.get(href!)).status()).toBe(200)
    }
  })

  test('the shared card image renders', async ({ page }) => {
    const response = await page.request.get('/opengraph-image')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  })

  for (const demo of DEMOS) {
    test(`${demo.label} is titled and shareable`, async ({ page }) => {
      await page.goto(demo.href)

      await expect(page).toHaveTitle(`${demo.label} · ${SITE_NAME}`)
      expect(await meta(page, 'property="og:title"')).toBe(demo.label)
      expect(await meta(page, 'property="og:site_name"')).toBe(SITE_NAME)
      expect(await meta(page, 'name="description"')).toBe(demo.summary)
      expect(await meta(page, 'name="twitter:card"')).toBe(
        'summary_large_image'
      )

      // The card image, the thing that silently goes missing.
      expect(await meta(page, 'property="og:image"')).toContain(
        '/opengraph-image'
      )

      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        `${SITE_URL}${demo.href}`
      )
    })
  }

  test('robots points at the sitemap and keeps shared files out', async ({
    page,
  }) => {
    const robots = await (await page.request.get('/robots.txt')).text()

    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
    expect(robots).toContain('Disallow: /api/')
  })

  test('the sitemap lists every demo', async ({ page }) => {
    const sitemap = await (await page.request.get('/sitemap.xml')).text()

    for (const demo of DEMOS) {
      expect(sitemap, demo.href).toContain(`${SITE_URL}${demo.href}`)
    }
  })

  test.describe('type', () => {
    /**
     * The floor, checked where it actually applies.
     *
     * Sizes come from several places at once: this app, the shared tokens, and
     * components inside `@acid-info/logos-ui` that set their own. Only the
     * rendered page shows the result, and a 12px button label survived two
     * rounds of grepping the source before this caught it.
     */
    for (const path of ['/', '/messaging', '/blockchain', '/storage']) {
      test(`nothing on ${path} renders below 14px`, async ({ page }) => {
        await page.goto(path)

        const smallest = await page.evaluate(() => {
          let min = Infinity
          let sample = ''
          for (const el of document.querySelectorAll('*')) {
            const ownText = [...el.childNodes].some(
              (node) => node.nodeType === 3 && node.textContent?.trim()
            )
            if (!ownText) continue

            const size = parseFloat(getComputedStyle(el).fontSize)
            if (size < min) {
              min = size
              sample = el.textContent?.trim().slice(0, 40) ?? ''
            }
          }
          return { min, sample }
        })

        expect(
          smallest.min,
          `smallest text: ${smallest.sample}`
        ).toBeGreaterThanOrEqual(14)
      })
    }
  })
})
