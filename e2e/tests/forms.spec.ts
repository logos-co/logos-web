import { CONNECT_FORM_ROUTES } from '@constants/logos-web'
import { expect, test } from '@fixtures/site.fixture'

// Read-only: these forms reach real people (CRM intake, newsletter). Check
// that they render and stay locked behind hCaptcha; never submit one.
test.describe('logos.co forms', () => {
  for (const route of CONNECT_FORM_ROUTES) {
    test(`${route} shows the intake form behind hCaptcha`, async ({ page }) => {
      await page.goto(route)

      await expect(
        page.getByRole('textbox', { name: /nickname\/name/i })
      ).toBeVisible()
      await expect(
        page.getByRole('textbox', { name: /^email\*/i })
      ).toBeVisible()
      await expect(
        page.getByRole('combobox', { name: /city\*/i })
      ).toBeVisible()

      const captcha = page.locator('iframe[src*="hcaptcha.com"]').first()
      await captcha.scrollIntoViewIfNeeded()
      await expect(captcha).toBeVisible()
      await expect(page.getByRole('button', { name: /^send$/i })).toBeDisabled()
    })
  }

  test('the footer newsletter form renders', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(
      footer.getByRole('textbox', { name: /enter email/i })
    ).toBeVisible()
    await expect(
      footer.getByRole('button', { name: /^submit$/i })
    ).toBeVisible()
  })
})
