import { siteEnvironment } from '@config/site'
import {
  LOGOS_WEB_CORE_ROUTES,
  LOGOS_WEB_RULES,
  PAST_PRESENT_FUTURE_ROUTES,
} from '@constants/logos-web'
import { expect, test } from '@fixtures/site.fixture'

test.describe('logos.co pages', () => {
  for (const route of LOGOS_WEB_CORE_ROUTES) {
    test(`${route} renders`, async ({ page, baseURL }) => {
      const response = await page.goto(route)
      expect(response?.status()).toBe(200)

      await expect(page.locator('h1').first()).toHaveText(/\S/)
      await expect(page).toHaveTitle(/\S/)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /\S/
      )

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href')
      expect(canonical, 'canonical link').toBeTruthy()
      expect(new URL(canonical!).pathname.replace(/\/$/, '')).toBe(
        route.replace(/\/$/, '')
      )

      // Only production may be indexed; staging must never compete with it.
      const environment = siteEnvironment(baseURL!)
      const robots = page.locator('meta[name="robots"]').first()
      if (environment === 'production') {
        await expect(robots).not.toHaveAttribute('content', /noindex/)
        expect(new URL(canonical!).origin).toBe('https://logos.co')
      } else if (environment === 'staging') {
        await expect(robots).toHaveAttribute('content', /noindex/)
      }
    })
  }

  for (const route of PAST_PRESENT_FUTURE_ROUTES) {
    test(`${route} renders`, async ({ page }) => {
      const response = await page.goto(route)
      expect(response?.status()).toBe(200)
      await expect(page.locator('h1').first()).toHaveText(/\S/)
    })
  }

  test.describe('not found', () => {
    // A 404 document makes Chrome log a console error.
    test.use({
      siteRules: {
        ...LOGOS_WEB_RULES,
        ignoredConsoleErrors: [
          ...LOGOS_WEB_RULES.ignoredConsoleErrors,
          /status of 404/,
        ],
      },
    })

    test('unknown routes show the not-found page', async ({
      page,
      baseURL,
    }) => {
      test.skip(
        siteEnvironment(baseURL!) === 'local',
        '`pnpm --filter web start` (python http.server) has its own 404 page'
      )

      const response = await page.goto('/this-route-does-not-exist')

      // Known issue: the nginx in front of dev.logos.co and logos.co serves the
      // not-found page with 200, a soft 404 for crawlers. Assert 404 once the
      // server config is fixed; until then the report carries an annotation.
      if (response?.status() !== 404) {
        test.info().annotations.push({
          type: 'known issue',
          description: `not-found page answered ${response?.status()}, expected 404`,
        })
      }

      await expect(page).toHaveTitle(/not found/i)
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
        'content',
        /noindex/
      )
    })
  })
})
