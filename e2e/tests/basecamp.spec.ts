import {
  BASECAMP_CLIENTS,
  BASECAMP_RELEASES,
  BASECAMP_REPO,
} from '@constants/logos-web'
import { expect, test } from '@fixtures/site.fixture'
import { getLatestRelease } from '@helpers/github-releases'

import type { Page } from '@playwright/test'

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const RELEASE_ASSET = new RegExp(
  `^${escape(BASECAMP_RELEASES)}/download/([^/]+)/[^/]+$`
)

type BasecampClient = (typeof BASECAMP_CLIENTS)[number]

/**
 * Chromium reports the host's platform through `navigator.userAgentData`
 * whatever the user agent says, so pin both to the client under test.
 */
async function emulateClient(page: Page, client: BasecampClient) {
  await page.addInitScript(
    ({ navigatorPlatform, userAgentData }) => {
      const data = userAgentData && {
        platform: userAgentData.platform,
        getHighEntropyValues: async () => ({ ...userAgentData, bitness: '64' }),
      }
      Object.defineProperty(Navigator.prototype, 'platform', {
        get: () => navigatorPlatform,
      })
      Object.defineProperty(Navigator.prototype, 'userAgentData', {
        get: () => data ?? undefined,
      })
    },
    {
      navigatorPlatform: client.navigatorPlatform,
      userAgentData: client.userAgentData,
    }
  )
}

test.describe('logos.co Basecamp downloads', () => {
  for (const client of BASECAMP_CLIENTS) {
    test.describe(client.name, () => {
      test.use({ userAgent: client.userAgent })

      test(`the install button fits ${client.name}`, async ({ page }) => {
        await emulateClient(page, client)

        await page.goto('/basecamp')
        const install = page
          .getByRole('link', { name: /install basecamp/i })
          .first()

        if (client.asset) {
          await expect(install).toHaveAttribute('href', RELEASE_ASSET)
          await expect(install).toHaveAttribute('href', client.asset)
        } else {
          await expect(install).toHaveAttribute(
            'href',
            `${BASECAMP_RELEASES}/latest`
          )
        }
      })
    })
  }

  test.describe('release', () => {
    const mac = BASECAMP_CLIENTS[0]
    test.use({ userAgent: mac.userAgent })

    test('every download link is an asset of the latest full release', async ({
      page,
      request,
    }) => {
      await emulateClient(page, mac)
      await page.goto('/basecamp')
      // Install buttons get their final URL after hydration.
      await expect(
        page.getByRole('link', { name: /install basecamp/i }).first()
      ).toHaveAttribute('href', mac.asset)

      const hrefs = await page
        .locator(`a[href^="${BASECAMP_RELEASES}/download/"]`)
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')!))
      const downloads = [...new Set(hrefs)]
      expect(downloads.length).toBeGreaterThan(0)

      // The API's latest release skips drafts and prereleases, the same rule
      // the build applies when it picks the download URLs. Asked through the
      // API: GitHub answers anonymous github.com traffic with 504s when it is
      // under load.
      const latest = await getLatestRelease(request, BASECAMP_REPO)

      for (const href of downloads) {
        expect(href.match(RELEASE_ASSET)?.[1], href).toBe(latest.tag_name)
        const asset = latest.assets.find(
          (asset) => asset.browser_download_url === href
        )
        expect(asset?.state, href).toBe('uploaded')
      }
    })
  })
})
