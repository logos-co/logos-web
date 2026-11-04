import { expect, test } from '@fixtures/site.fixture'

test.describe('logos.co movement', () => {
  test('the circles map loads tiles and markers', async ({ page }) => {
    await page.goto('/movement')
    const map = page.locator('.leaflet-container').first()
    // The map loads when it scrolls into view.
    await map.scrollIntoViewIfNeeded()
    await expect(map).toBeVisible()
    await expect(map.locator('.leaflet-tile-loaded').first()).toBeVisible()
    await expect(map.locator('.leaflet-marker-icon').first()).toBeVisible()
  })

  test('a zine opens in the reader and turns pages', async ({ page }) => {
    await page.goto('/zines')
    const zine = page.locator('a[href^="/zines/"]').first()
    const href = await zine.getAttribute('href')
    await zine.click()
    await expect(page).toHaveURL(new RegExp(`${href}/?$`))
    await expect(page.locator('h1').first()).toHaveText(/\S/)

    const previous = page.getByRole('button', { name: /previous page/i })
    await expect(previous).toBeDisabled()
    await page.getByRole('button', { name: /next page/i }).click()
    await expect(previous).toBeEnabled()
  })

  test('an RFP opens from the Builders Hub', async ({ page }) => {
    // The old path redirects to /rfp where that change is deployed (staging
    // first), so start there and accept links under either path.
    await page.goto('/builders-hub/rfps')
    const rfp = page
      .locator('a[href^="/rfp/"], a[href^="/builders-hub/rfps/"]')
      .first()
    const href = await rfp.getAttribute('href')
    const response = await page.goto(href!)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toHaveText(/\S/)
  })

  test('an idea opens from the Builders Hub', async ({ page }) => {
    await page.goto('/builders-hub/ideas')
    const idea = page.locator('a[href^="/builders-hub/ideas/"]').first()
    const href = await idea.getAttribute('href')
    const response = await page.goto(href!)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toHaveText(/\S/)
  })
})
