import messages from '../../messages/en.json'
import { describe, expect, test } from 'vitest'

import { ROUTES } from '@/constants/routes'

describe('node programme page contract', () => {
  test('uses the British English public route', () => {
    expect(ROUTES.nodeProgramme).toBe('/node-programme')
  })

  test('has copy for the signup form and imported source sections', () => {
    expect(messages.pages.nodeProgramme.hero.title).toBe(
      'Be the first to join the node programme'
    )
    expect(messages.pages.nodeProgramme.signup.endpointPath).toBe(
      '/api/forms/logos-co/take-action'
    )
    expect(messages.pages.nodeProgramme.stack.items).toHaveLength(3)
    expect(messages.pages.nodeProgramme.useCases.items).toHaveLength(5)
  })
})
