import { expect, test } from '@playwright/test'

/**
 * Each test creates the record it needs through the public intake endpoint,
 * so it does not depend on the demo seed being present or unchanged.
 */
async function captureIntake(
  request: import('@playwright/test').APIRequestContext,
  name: string
): Promise<{ caseId: string }> {
  const submissionId = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const response = await request.post('/api/public/intake', {
    data: {
      formName: 'afformCoalitionPartner',
      submissionId,
      name,
      email: `${submissionId}@example.test`,
      affiliatedOrgs: 'E2E Collective',
      'How did you first hear about Logos?': '6',
      wantsNewsletter: true,
    },
  })

  expect(response.status()).toBe(201)
  const body = (await response.json()) as { item: { caseId: string } }
  return { caseId: body.item.caseId }
}

/** The workspace renders its shell before the queries land; wait for data. */
async function openCases(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/cases')
  await expect(
    page.getByRole('heading', { name: 'Cases', exact: true })
  ).toBeVisible()
  // The counts read "-" until the queries land, so waiting for a number is
  // waiting for real data rather than for the shell.
  await expect(
    page
      .getByLabel('Case queues')
      .getByRole('button', { name: /All cases \d+/ })
  ).toBeVisible()
}

test('a funnel submission arrives as an untriaged case in the queue', async ({
  page,
  request,
}) => {
  const applicant = `Intake Applicant ${Date.now()}`
  await captureIntake(request, applicant)

  await openCases(page)
  await page
    .getByLabel('Case queues')
    .getByRole('button', { name: /Needs triage/ })
    .click()

  // The public funnel files submissions on the Movement board, so the case is
  // not on the Ecodev board a coordinator opens on. The pipeline tab has to
  // carry the count, because a board that hides new intake behind a tab with
  // no number on it is how intake gets missed.
  await page
    .getByLabel('Pipelines')
    .getByRole('button', { name: /Movement [1-9]/ })
    .click()

  const row = page.getByRole('link', { name: new RegExp(applicant) })
  await expect(row).toBeVisible()
  // Unassigned and untriaged is the honest state for something nobody has
  // looked at, and the board has to show it that way.
  await expect(page.getByText('Unassigned').first()).toBeVisible()
})

test('an empty board says which pipeline the matches are on', async ({
  page,
  request,
}) => {
  const applicant = `Elsewhere Applicant ${Date.now()}`
  await captureIntake(request, applicant)

  await openCases(page)
  // A search only this case can match, so the Ecodev board is genuinely empty
  // rather than empty by coincidence of what else is seeded.
  await page.getByPlaceholder('Case, organisation, owner').fill(applicant)

  const switcher = page.getByRole('button', { name: /1 on Movement/ })
  await expect(switcher).toBeVisible()
  await switcher.click()

  await expect(
    page.getByRole('link', { name: new RegExp(applicant) })
  ).toBeVisible()
})

test('the list spans every pipeline and names which board a case is on', async ({
  page,
  request,
}) => {
  const applicant = `List Applicant ${Date.now()}`
  await captureIntake(request, applicant)

  await openCases(page)
  await page.getByRole('button', { name: 'List', exact: true }).click()

  const row = page.getByRole('link', { name: new RegExp(applicant) })
  await expect(row).toBeVisible()
  await expect(page.getByText('New Lead').first()).toBeVisible()
})

test('an untriaged case shows triage as its next action', async ({
  page,
  request,
}) => {
  const applicant = `Triage Applicant ${Date.now()}`
  const { caseId } = await captureIntake(request, applicant)

  await page.goto(`/cases/${caseId}`)

  await expect(
    page.getByRole('heading', { name: 'Review intake' })
  ).toBeVisible()
  // Owner and task assignee both read "Unassigned", which is the point.
  await expect(page.getByText('Unassigned').first()).toBeVisible()
})

test('a coordinator records an evaluation and a decision', async ({
  page,
  request,
}) => {
  const applicant = `Decision Applicant ${Date.now()}`
  const { caseId } = await captureIntake(request, applicant)

  await page.goto(`/cases/${caseId}`)

  await page.getByRole('button', { name: 'Record' }).first().click()
  // Anchored to its own label rather than "the first combobox on the page":
  // the case detail carries several selects now, and a positional locator
  // silently starts driving a different control every time one is added.
  await page.getByLabel('Score').selectOption('4')
  await page
    .getByPlaceholder('What did this stage show?')
    .fill('Strong alignment on the coalition track.')
  await page.getByRole('button', { name: 'Save stage' }).click()

  await expect(page.getByText('1 scored')).toBeVisible()

  await page
    .getByPlaceholder('Why this outcome?')
    .fill('Clear fit for the coalition track.')
  await page.getByRole('button', { name: 'Approved' }).click()

  await expect(page.getByText('Approved')).toBeVisible()
  // The draft only appears once a decision exists, and carries the reason.
  await expect(page.getByText('Response draft')).toBeVisible()
  await expect(
    page.getByText('Clear fit for the coalition track.').first()
  ).toBeVisible()
})

test('the organisation field searches, and Enter creates what is not there', async ({
  page,
}) => {
  await openCases(page)
  await page.getByRole('button', { name: 'New case' }).click()

  const title = `Waku relay pilot ${Date.now()}`
  await page.getByPlaceholder('What are we coordinating?').fill(title)

  // Typing filters the existing organisations rather than making the user
  // scroll a list that a native select could not have filtered at all.
  const organisation = page.getByRole('combobox', { name: 'Organisation' })
  await organisation.fill('mesh')
  await expect(
    page.getByRole('option', { name: /Meshnet Node Collective/ })
  ).toBeVisible()

  // A name nothing matches is offered as a new record, and Enter takes it.
  const newOrganisation = `Cypherpunk Hall ${Date.now()}`
  await organisation.fill(newOrganisation)
  await expect(
    page.getByRole('option', { name: new RegExp(`Add .${newOrganisation}`) })
  ).toBeVisible()
  await organisation.press('Enter')
  await expect(organisation).toHaveValue(newOrganisation)

  // Enter inside the combobox must not have submitted the form behind it.
  await expect(page.getByRole('heading', { name: 'Open a case' })).toBeVisible()

  await page.getByRole('button', { name: 'Create case' }).click()

  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByText(newOrganisation).first()).toBeVisible()
})

test('Escape closes the dropdown without discarding the form', async ({
  page,
}) => {
  await openCases(page)
  await page.getByRole('button', { name: 'New case' }).click()

  const title = `Nomos cohort ${Date.now()}`
  await page.getByPlaceholder('What are we coordinating?').fill(title)

  const contact = page.getByRole('combobox', { name: 'Primary contact' })
  await contact.click()
  await expect(page.getByRole('listbox')).toBeVisible()

  await contact.press('Escape')

  await expect(page.getByRole('listbox')).toBeHidden()
  // The dialog shares the Escape key, so this is the regression that matters:
  // losing the dropdown must not lose everything already typed.
  await expect(page.getByPlaceholder('What are we coordinating?')).toHaveValue(
    title
  )
})
