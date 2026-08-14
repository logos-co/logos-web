import { expect, test } from '@playwright/test'

/**
 * Scout runs on seeded synthetic candidates, so these tests read the demo
 * fixtures rather than creating their own: there is no discovery endpoint to
 * create a candidate with, which is itself the property under test.
 */
test('the inbox puts disagreeing sources above candidates that are ready', async ({
  page,
}) => {
  await page.goto('/scout')

  await expect(page.getByRole('heading', { name: 'Scout' })).toBeVisible()
  const items = page.locator('.scout-list-item')
  await expect(items.first()).toBeVisible()

  await expect(items.first()).toContainText('Sources disagree')
  await expect(items.first()).toContainText('Quorum Field')
})

test('a candidate explains its bands with the quoted source behind them', async ({
  page,
}) => {
  await page.goto('/scout')
  await page.getByRole('link', { name: /Halcyon Relay Collective/ }).click()

  await expect(
    page.getByRole('heading', { name: 'Halcyon Relay Collective' })
  ).toBeVisible()

  // The gate is about our evidence, and the page says so rather than implying
  // the organisation itself has been approved.
  await expect(page.getByText('Ready to review')).toBeVisible()
  await expect(page.getByText('There is no total')).toBeVisible()
  await expect(
    page.getByText('We operate relays for censorship-resistant messaging')
  ).toBeVisible()
})

test('a quarantined candidate keeps nothing and cannot be reviewed', async ({
  page,
}) => {
  await page.goto('/scout')
  await page
    .getByRole('link', { name: /Sole Practitioner Consultancy/ })
    .click()

  await expect(page.getByText('Nothing was stored about this')).toBeVisible()
  await expect(
    page.getByText('A quarantined candidate cannot be reviewed')
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept' })).toHaveCount(0)
})

test('a decision is recorded against the reviewer and creates no CRM record', async ({
  page,
  request,
}) => {
  const before = await (await request.get('/api/v1/organisations')).json()

  await page.goto('/scout')
  await page.getByRole('link', { name: /Meshwork Commons/ }).click()

  await page
    .getByPlaceholder('Why this decision?')
    .fill('Relevant, but the handbook is the only recent thing they publish.')
  await page.getByRole('button', { name: 'Watch' }).click()

  await expect(page.getByText('Watching').first()).toBeVisible()
  await expect(
    page.getByText('Relevant, but the handbook is the only recent thing')
  ).toBeVisible()

  const after = await (await request.get('/api/v1/organisations')).json()
  expect(after.items.length).toBe(before.items.length)
})
