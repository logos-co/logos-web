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

  const row = page.getByRole('link', { name: new RegExp(applicant) })
  await expect(row).toBeVisible()
  // Unassigned and untriaged is the honest state for something nobody has
  // looked at, and the list has to show it that way.
  await expect(page.getByText('Unassigned').first()).toBeVisible()
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
  await page.getByRole('combobox').first().selectOption('4')
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
