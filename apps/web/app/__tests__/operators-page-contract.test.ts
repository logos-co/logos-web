import { describe, expect, test } from 'vitest'

import { ROUTES } from '@/constants/routes'

import operatorsContent from '../../../../content/pages/en/operators.json' with { type: 'json' }

type OperatorsCopySection = {
  componentType: 'operatorsCopy'
  key: string
  banner: {
    title: string
    body: string
  }
}

describe('operators page contract', () => {
  test('uses the standalone operators route', () => {
    expect(ROUTES.operators).toBe('/operators')
    expect(operatorsContent.route).toBe(ROUTES.operators)
  })

  test('keeps the closure banner in content fixtures', () => {
    const section = operatorsContent.sections[0] as OperatorsCopySection

    expect(section.componentType).toBe('operatorsCopy')
    expect(section.banner.title).toBe('Logos Operator programme')
    expect(section.banner.body).toContain(
      "We're closing the Logos Operator programme as Epoch 3 has now ended."
    )
    expect(section.banner.body).toContain(
      'Thank you for your participation and enthusiasm.'
    )
  })
})
