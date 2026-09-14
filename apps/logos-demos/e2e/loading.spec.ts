/**
 * What the demos show while they are waiting.
 *
 * These pages read live networks, so there is always a wait, and it used to be
 * blank. The responses are delayed here on purpose: locally they answer in
 * well under a second, which is exactly why this could not be checked by hand.
 */
import { expect, test, type Page, type Route } from '@playwright/test'

/** Hold a response back long enough to see what the page does meanwhile. */
async function delay(page: Page, pattern: string, ms = 3000) {
  await page.route(pattern, async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, ms))
    await route.continue()
  })
}

test.describe('loading states', () => {
  test('the blockchain shows its shape before the nodes answer', async ({
    page,
  }) => {
    await delay(page, '**/api/chain')
    await page.goto('/blockchain')

    const busy = page.getByLabel('Reading the testnet nodes')
    await expect(busy).toBeVisible()

    // The labels are known before the values are, so they are real text.
    await expect(busy.getByText('Height', { exact: true })).toBeVisible()
    await expect(busy.getByText('Chain tip', { exact: true })).toBeVisible()

    // And it gives way to the real thing rather than sitting there.
    await expect(page.getByText('Producing blocks')).toBeVisible({
      timeout: 30_000,
    })
    await expect(busy).toHaveCount(0)
  })

  test('the roster shows its shape before it arrives', async ({ page }) => {
    await delay(page, '**/api/storage/fleet**')
    await page.goto('/storage')

    const busy = page.getByLabel('Reading the roster')
    await expect(busy).toBeVisible()
    await expect(busy.getByText('Nodes', { exact: true })).toBeVisible()

    await expect(busy).toHaveCount(0, { timeout: 30_000 })
    await expect(
      page.getByText('AC-CN-HONGKONG-C', { exact: false })
    ).toBeVisible()
  })

  test('a node card keeps its rows while it is being located', async ({
    page,
  }) => {
    // The roster arrives first and the geolocation follows, so these two rows
    // would otherwise be absent and then appear, pushing the card open.
    await delay(page, '**/echo.codex.storage/**', 5000)
    await page.goto('/storage')

    const card = page.getByRole('article').first()
    await expect(card).toBeVisible({ timeout: 30_000 })

    // Present from the start, with a placeholder standing in for the value.
    await expect(card.getByText('Located', { exact: true })).toBeVisible()
    await expect(card.getByText('Network', { exact: true })).toBeVisible()

    const before = (await card.boundingBox())?.height ?? 0

    await expect(
      card.getByText(/Hong Kong|Amsterdam|United States/)
    ).toBeVisible({ timeout: 30_000 })

    const after = (await card.boundingBox())?.height ?? 0

    /*
     * Not pixel-identical, and it cannot be: a value of unknown length may
     * wrap, and some network names do. What the placeholder buys is that the
     * rows exist from the start, so the card settles rather than unfolds. One
     * wrapped line is the most that can legitimately change.
     */
    const oneLine = 20
    expect(after - before).toBeGreaterThanOrEqual(0)
    expect(after - before).toBeLessThanOrEqual(oneLine)
  })
})
