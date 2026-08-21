import { expect, test, type Page } from '@playwright/test'

/**
 * Scout runs on seeded synthetic candidates, so these tests read the demo
 * fixtures and synthetic discovery rather than contacting external sources.
 */
async function openScoutView(
  page: Page,
  view: 'Leads' | 'Qualification'
): Promise<void> {
  await page.goto('/scout')
  await page.getByRole('button', { name: new RegExp(view) }).click()
}

test('the inbox puts disagreeing sources above candidates that are ready', async ({
  page,
}) => {
  await openScoutView(page, 'Leads')

  await expect(page.getByRole('heading', { name: 'Scout' })).toBeVisible()
  const items = page.locator('.scout-list-item')
  await expect(items.first()).toBeVisible()

  await expect(items.first()).toContainText('Sources disagree')
  await expect(items.first()).toContainText('Quorum Field')
})

test('a candidate explains its bands with the quoted source behind them', async ({
  page,
}) => {
  await openScoutView(page, 'Leads')
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

test('leads hide quarantined candidates while their audit record stays available', async ({
  page,
  request,
}) => {
  await openScoutView(page, 'Leads')

  await expect(page.getByText('Quarantined', { exact: true })).toHaveCount(0)

  const response = await request.get('/api/v1/scout/candidates')
  const payload = (await response.json()) as {
    items: Array<{ id: string; reviewState: string }>
  }
  const quarantined = payload.items.find(
    (candidate) => candidate.reviewState === 'quarantined'
  )
  expect(quarantined).toBeDefined()

  await page.goto(`/scout/${quarantined?.id}`)

  await expect(page.getByText('Nothing was stored about this')).toBeVisible()
  await expect(
    page.getByText('A quarantined candidate cannot be reviewed')
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Qualify' })).toHaveCount(0)
})

test('the potential lead count matches the rendered lead list', async ({
  page,
}) => {
  await openScoutView(page, 'Leads')
  await expect(page.locator('.scout-list-item').first()).toBeVisible()

  const leadStep = page.getByRole('button', { name: /Leads/ })
  const count = Number(
    /Leads\s+(\d+)\s+potential/.exec(await leadStep.innerText())?.[1]
  )

  await expect(page.locator('.scout-list-item')).toHaveCount(count)
  await expect(
    page
      .locator('.scout-list-item', { hasText: 'Vault Lattice' })
      .locator('.scout-list-evidence')
  ).toContainText('1 source')
})

test('a decision is recorded against the reviewer and creates no CRM record', async ({
  page,
  request,
}) => {
  const before = await (await request.get('/api/v1/organisations')).json()

  await openScoutView(page, 'Qualification')
  await page.getByRole('link', { name: /Meshwork Commons/ }).click()

  await page.getByLabel('Reason type').selectOption('active_project')
  await page.getByLabel('Continue to the next lead after qualifying').uncheck()
  await page
    .getByPlaceholder('What evidence supports this decision?')
    .fill('Relevant, but the handbook is the only recent thing they publish.')
  await page.getByRole('button', { name: 'Nurture' }).click()

  await expect(page.getByText('Nurture').first()).toBeVisible()
  await expect(
    page.getByText('Relevant, but the handbook is the only recent thing')
  ).toBeVisible()

  const after = await (await request.get('/api/v1/organisations')).json()
  expect(after.items.length).toBe(before.items.length)
})

test('requesting evidence records the missing field as follow-up work', async ({
  page,
}) => {
  await openScoutView(page, 'Qualification')
  await page.getByRole('link', { name: /Vault Lattice/ }).click()

  await page.getByLabel('Reason type').selectOption('insufficient_evidence')
  await page
    .getByPlaceholder('What evidence supports this decision?')
    .fill('Confirm how an outside contributor can participate.')
  await page.getByLabel('Contribution path').check()
  await page.getByLabel('Continue to the next lead after qualifying').uncheck()
  await page.getByRole('button', { name: 'Research' }).click()

  await expect(page.getByText('Open evidence request')).toBeVisible()
  const openRequest = page.locator('.scout-open-request')
  await expect(openRequest).toContainText(
    'Confirm how an outside contributor can participate.'
  )
  await expect(openRequest).toContainText('Contribution path')
})

test('review coordination keeps an owner, note, and review date', async ({
  page,
}) => {
  await openScoutView(page, 'Leads')
  await page.getByRole('link', { name: /Halcyon Relay Collective/ }).click()
  await page.getByText('Review coordination', { exact: true }).click()

  await page.getByLabel('Assigned reviewer').selectOption({ index: 1 })
  await page.getByLabel('Review again').fill('2026-09-01')
  await page
    .getByPlaceholder('Context for the next reviewer')
    .fill('Check the standards working group before deciding.')
  await page.getByRole('button', { name: 'Save coordination' }).click()

  await expect(page.getByText('Review coordination saved.')).toBeVisible()
  await page.reload()
  await page.getByText('Review coordination', { exact: true }).click()
  await expect(page.getByLabel('Review again')).toHaveValue('2026-09-01')
  await expect(
    page.getByPlaceholder('Context for the next reviewer')
  ).toHaveValue('Check the standards working group before deciding.')
})

test('review sessions continue to the next candidate after a decision', async ({
  page,
}) => {
  await openScoutView(page, 'Leads')
  await page.getByRole('link', { name: /Beacon Standards Group/ }).click()
  const previousUrl = page.url()

  await page.getByLabel('Reason type').selectOption('out_of_scope')
  await page
    .getByPlaceholder('What evidence supports this decision?')
    .fill('No current work matches this discovery brief.')
  await page.getByRole('button', { name: 'Disqualify' }).click()

  await expect(page).not.toHaveURL(previousUrl)
  await expect(page.getByText(/Candidate \d+ of \d+/)).toBeVisible()
})

test('search narrows the queue by name, domain, and summary', async ({
  page,
}) => {
  await openScoutView(page, 'Leads')
  await expect(page.locator('.scout-list-item').first()).toBeVisible()

  // Addressed by its label rather than its placeholder: the placeholder
  // changes with whether the source adapters are enabled.
  await page.getByLabel('Search candidates').fill('meshwork')

  await expect(page.locator('.scout-list-item')).toHaveCount(1)
  await expect(page.locator('.scout-list-item')).toContainText(
    'Meshwork Commons'
  )
})

test('the internal report summarises workflow without candidate notes', async ({
  page,
}) => {
  await page.goto('/scout')
  await page.getByRole('link', { name: 'Review report' }).click()

  await expect(
    page.getByRole('heading', { name: 'Scout quality and workflow' })
  ).toBeVisible()
  await expect(page.getByText('Discovery runs')).toBeVisible()
  await expect(page.getByText('Review decisions')).toBeVisible()
  await expect(page.getByText('Product signals')).toBeVisible()
  await expect(
    page.getByText('Check the standards working group before deciding.')
  ).toHaveCount(0)
})

test('a saved brief runs synthetic discovery and the queue matches its report', async ({
  page,
}) => {
  await page.goto('/scout')
  await page.getByRole('button', { name: /Leads/ }).click()
  // Counted after the queue has rendered: counting straight after navigation
  // reads zero and then compares against a list that was always going to grow.
  await expect(page.locator('.scout-list-item').first()).toBeVisible()
  const before = await page.locator('.scout-list-item').count()
  await page.getByRole('button', { name: /Find/ }).click()

  await page.getByLabel('Target description').fill('community infrastructure')
  await page.getByRole('button', { name: 'Find organisations' }).click()

  const notice = page.locator('.scout-notice')
  await expect(notice).toBeVisible()

  // The catalogue is finite, and running out is a real outcome rather than a
  // broken test: this asserts the invariant that holds either way, which is
  // that the queue grew by exactly the number the run claimed to add.
  const reported = await notice.textContent()
  const added = Number(/Added (\d+) synthetic/.exec(reported ?? '')?.[1] ?? 0)

  if (added === 0) {
    expect(reported).toContain('No synthetic examples match')
  } else {
    expect(reported).toContain('No external source was contacted')
  }

  await expect(async () => {
    expect(await page.locator('.scout-list-item').count()).toBe(before + added)
  }).toPass()
  await page.getByRole('button', { name: /Find/ }).click()
  await page.getByText('Recent searches', { exact: false }).click()
  await expect(
    page
      .locator('.scout-run-history-grid')
      .getByText('Synthetic catalogue')
      .first()
  ).toBeVisible()
})

test('two candidates can be compared without turning the comparison into a score', async ({
  page,
}) => {
  await openScoutView(page, 'Qualification')
  await expect(page.locator('.scout-list-item').first()).toBeVisible()

  await page.getByLabel('Select Quorum Field').check()
  await page.getByLabel('Select Halcyon Relay Collective').check()
  await page.getByRole('button', { name: 'Compare 2' }).click()

  const comparison = page.getByRole('dialog', {
    name: 'Review the evidence side by side',
  })
  await expect(comparison).toContainText('Quorum Field')
  await expect(comparison).toContainText('Halcyon Relay Collective')
  await expect(comparison).toContainText('Evidence readiness')
  await expect(comparison).not.toContainText('Total score')
})

test('several candidates can be decided together, but never qualified together', async ({
  page,
}) => {
  await openScoutView(page, 'Qualification')
  await expect(page.locator('.scout-list-item').first()).toBeVisible()

  await page.locator('.scout-select input').first().check()

  await page
    .getByPlaceholder('One reason for all of them')
    .fill('Clearing the queue after a first pass.')

  // Qualification is a per-lead judgement, so the bulk bar does not offer it.
  await expect(
    page
      .locator('.scout-bulk-actions')
      .getByRole('button', { name: 'Qualify', exact: true })
  ).toHaveCount(0)

  await page
    .locator('.scout-bulk-actions')
    .getByRole('button', { name: 'Disqualify' })
    .click()

  await expect(page.getByText('1 candidate decided.')).toBeVisible()
})
