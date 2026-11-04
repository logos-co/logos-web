import { expect, test } from '@fixtures/site.fixture'

// Media comes from the blog CMS (Strapi) and Simplecast at build time, so these
// tests catch a build that shipped with an empty or broken feed.
test.describe('logos.co media', () => {
  test('the article list links to articles that open', async ({ page }) => {
    await page.goto('/media/articles')
    const article = page.locator('a[href^="/media/article/"]').first()
    const href = await article.getAttribute('href')
    expect(href).toBeTruthy()

    const response = await page.goto(href!)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toHaveText(/\S/)
    await expect(page.getByRole('paragraph').first()).toHaveText(/\w+/)
  })

  test('the podcast list links to episodes that open', async ({ page }) => {
    await page.goto('/media/podcasts')
    const episode = page.locator('a[href^="/media/podcasts/"]').first()
    const href = await episode.getAttribute('href')
    expect(href).toBeTruthy()

    const response = await page.goto(href!)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toHaveText(/\S/)
  })

  test('media search finds articles', async ({ page }) => {
    await page.goto('/media')
    await page.getByRole('button', { name: /search logos media/i }).click()

    const dialog = page.getByRole('dialog', { name: /search logos media/i })
    await dialog
      .getByRole('textbox', { name: /search logos media/i })
      .fill('waku')
    await dialog
      .getByRole('textbox', { name: /search logos media/i })
      .press('Enter')

    await expect(dialog.getByText(/\d+ results?/i)).toBeVisible()
    await expect(dialog.locator('a[href^="/media/"]').first()).toBeVisible()
  })
})
