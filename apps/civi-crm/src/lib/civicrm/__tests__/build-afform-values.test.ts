import { describe, expect, it } from 'vitest'

import { buildAfformValues } from '../build-afform-values'

const individualField = {
  entity: 'Individual1',
  formKey: 'name',
  fieldName: 'first_name',
  join: null,
  inputType: 'text',
} as const

describe('buildAfformValues', () => {
  it('groups fields by entity', () => {
    const values = buildAfformValues(
      { name: 'Ada' },
      [
        individualField,
        {
          entity: 'Case1',
          formKey: 'caseProfile',
          fieldName: 'Circle_Case.Profile',
          join: null,
          inputType: 'hidden',
        },
      ]
    )

    expect(values.Individual1).toEqual([
      { fields: { first_name: 'Ada' }, joins: {} },
    ])
    expect(values.Case1).toBeUndefined()
  })

  it('injects Case1 profile and lead source for activist builder', () => {
    const values = buildAfformValues(
      { name: 'Ada' },
      [individualField],
      'afformActivistBuilder'
    )

    expect(values.Case1).toEqual([
      {
        fields: {
          'Circle_Case.Profile': ['2'],
          'Circle_Case.Lead_Source': ['2'],
        },
        joins: {},
      },
    ])
  })

  it('injects circle steward defaults for activist leader form', () => {
    const values = buildAfformValues(
      { name: 'Ada' },
      [individualField],
      'afformActivistLeaderSteward'
    )

    expect(values.Case1).toEqual([
      {
        fields: {
          'Circle_Case.Profile': ['1'],
          'Circle_Case.Lead_Source': ['1'],
        },
        joins: {},
      },
    ])
  })

  it('injects coalition partner defaults', () => {
    const values = buildAfformValues(
      { name: 'Ada' },
      [individualField],
      'afformCoalitionPartner'
    )

    expect(values.Case1).toEqual([
      {
        fields: {
          'Circle_Case.Profile': ['3'],
          'Circle_Case.Lead_Source': ['3'],
        },
        joins: {},
      },
    ])
  })

  it('injects connect defaults and keeps Note joined on Individual1', () => {
    const values = buildAfformValues(
      { name: 'Ada', openText: 'Helping with local events' },
      [
        individualField,
        {
          entity: 'Individual1',
          formKey: 'openText',
          fieldName: 'note',
          join: 'Note',
          inputType: 'textarea',
        },
      ],
      'afformCircleContactForm'
    )

    expect(values.Case1).toEqual([
      {
        fields: {
          'Circle_Case.Profile': ['5'],
          'Circle_Case.Lead_Source': ['7'],
        },
        joins: {},
      },
    ])
    expect(values.Individual1).toEqual([
      {
        fields: { first_name: 'Ada' },
        joins: {
          Note: [{ note: 'Helping with local events' }],
        },
      },
    ])
  })

  it('overrides client-provided case fields with server defaults', () => {
    const values = buildAfformValues(
      {
        name: 'Ada',
        caseProfile: '99',
        caseLeadSource: '99',
      },
      [
        individualField,
        {
          entity: 'Case1',
          formKey: 'caseProfile',
          fieldName: 'Circle_Case.Profile',
          join: null,
          inputType: 'hidden',
        },
      ],
      'afformActivistBuilder'
    )

    expect(values.Case1).toEqual([
      {
        fields: {
          'Circle_Case.Profile': ['2'],
          'Circle_Case.Lead_Source': ['2'],
        },
        joins: {},
      },
    ])
  })
})
