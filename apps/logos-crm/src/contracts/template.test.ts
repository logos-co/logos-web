import { describe, expect, test } from 'vitest'

import { listResponseTemplates, renderResponseTemplate } from './template'

const base = {
  applicantName: 'Amina Okafor',
  caseTitle: 'Coalition Partner — Amina Okafor',
  organisationName: 'Open Systems Lab',
  profile: 'Coalition Partner',
  decisionReason: 'Clear fit for the coalition track.',
  coordinatorName: 'Mara Chen',
}

describe('response templates', () => {
  test('covers every decision that is not pending', () => {
    expect(listResponseTemplates().map((item) => item.id)).toEqual([
      'approved',
      'redirected',
      'declined',
    ])
  })

  test('fills the applicant, organisation, reason, and coordinator', () => {
    const rendered = renderResponseTemplate('approved', base)

    expect(rendered?.body).toContain('Hi Amina Okafor,')
    expect(rendered?.body).toContain('on behalf of Open Systems Lab')
    expect(rendered?.body).toContain('Clear fit for the coalition track.')
    expect(rendered?.body).toContain('Mara Chen')
  })

  test('leaves no placeholder behind when fields are missing', () => {
    const rendered = renderResponseTemplate('declined', {
      ...base,
      organisationName: null,
      decisionReason: null,
    })

    // A message about to be sent to a real person must never show {{...}}.
    expect(rendered?.body).not.toMatch(/\{\{|\}\}/)
    expect(rendered?.body).not.toContain('on behalf of')
  })

  test('does not leave a blank gap where the reason would have been', () => {
    const rendered = renderResponseTemplate('redirected', {
      ...base,
      decisionReason: null,
    })

    expect(rendered?.body).not.toMatch(/\n{3,}/)
  })

  test('renders a distinct subject per outcome', () => {
    const approved = renderResponseTemplate('approved', base)
    const declined = renderResponseTemplate('declined', base)

    expect(approved?.subject).not.toBe(declined?.subject)
  })
})
