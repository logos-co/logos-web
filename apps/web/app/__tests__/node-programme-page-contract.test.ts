import messages from '../../messages/en.json'
import { describe, expect, test } from 'vitest'

import { ROUTES } from '@/constants/routes'

describe('node programme page contract', () => {
  test('uses the British English public route', () => {
    expect(ROUTES.nodeProgramme).toBe('/node-programme')
  })

  test('has copy for the signup form and imported source sections', () => {
    // Hero wording can change freely; only require it to be present text.
    expect(typeof messages.pages.nodeProgramme.hero.title).toBe('string')
    expect(
      messages.pages.nodeProgramme.hero.title.trim().length
    ).toBeGreaterThan(0)
    // Roles are functional form values (submitted to the signup API), so they
    // stay pinned as a contract rather than free copy.
    expect(messages.pages.nodeProgramme.signup.roles).toEqual([
      'Node operator',
      'Builder',
    ])
    expect(messages.pages.nodeProgramme.stack.items).toHaveLength(3)
    expect(messages.pages.nodeProgramme.useCases.items).toHaveLength(5)
  })
})
