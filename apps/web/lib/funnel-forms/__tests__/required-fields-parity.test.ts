/**
 * `apps/civi-crm` validates submissions against the same REQUIRED_FIELDS_BY_FORM
 * this schema is built from, but with its own notion of what counts as an
 * answer. These tests fail when the two disagree.
 */

import {
  findInvalidRequiredFields,
  REQUIRED_FIELDS_BY_FORM,
  type ProfileFormName,
} from '@repo/funnel'
import { describe, expect, it } from 'vitest'

import {
  AFFORM as BUILDER_AFFORM,
  AFFORM_NAME as BUILDER_NAME,
} from '../afform-activist-builder'
import {
  AFFORM as STEWARD_AFFORM,
  AFFORM_NAME as STEWARD_NAME,
} from '../afform-activist-leader-steward'
import {
  AFFORM as PARTNER_AFFORM,
  AFFORM_NAME as PARTNER_NAME,
} from '../afform-coalition-partner'
import { AFFORM_OPTIONS } from '../afform-options'
import { buildFormSchema } from '../contactFormSchema'
import { withHearAboutField } from '../hear-about-field'
import type { AfformConfig, AfformField, AfformOptions } from '../types'

const FORMS: [ProfileFormName, AfformConfig, AfformOptions][] = [
  [BUILDER_NAME, BUILDER_AFFORM, AFFORM_OPTIONS],
  [PARTNER_NAME, PARTNER_AFFORM, AFFORM_OPTIONS],
  [STEWARD_NAME, STEWARD_AFFORM, AFFORM_OPTIONS],
]

function sampleAnswer(field: AfformField, options: AfformOptions) {
  if (field.inputType === 'checkbox') return true
  if (field.inputType === 'email') return 'ada@example.com'
  if (field.inputType === 'select') {
    const value =
      (field.options ?? options[field.formKey] ?? [])[0]?.value ?? ''
    // `skills` is the one multiselect: the form holds it as an array.
    return field.formKey === 'skills' ? [value] : value
  }
  return 'Sample answer'
}

/** What `buildInitialData` starts an unanswered field at. */
function blankAnswer(field: AfformField) {
  if (field.inputType === 'checkbox') return true
  if (field.formKey === 'skills') return []
  if (field.repeatable || field.formKey === 'chatService') return ['']
  return ''
}

/** A submission answering the required fields and nothing else. */
function fillRequiredAnswers(
  name: ProfileFormName,
  afform: AfformConfig,
  options: AfformOptions
) {
  const fields = withHearAboutField(afform).fields
  const required = new Set<string>(REQUIRED_FIELDS_BY_FORM[name])

  const answers: Record<string, unknown> = { socials: '' }
  for (const field of fields) {
    answers[field.formKey] = required.has(field.formKey)
      ? sampleAnswer(field, options)
      : blankAnswer(field)
  }
  return answers
}

describe('REQUIRED_FIELDS_BY_FORM', () => {
  it.each(FORMS)(
    'accepts a %s submission the form schema accepts',
    (name, afform, options) => {
      // The endpoint must never reject what the form let through: a required
      // checkbox would satisfy the schema and fail `isAnswered`.
      const answers = fillRequiredAnswers(name, afform, options)
      const { schema } = buildFormSchema(
        withHearAboutField(afform).fields,
        REQUIRED_FIELDS_BY_FORM[name]
      )

      expect(schema.safeParse(answers).success).toBe(true)
      expect(findInvalidRequiredFields(name, answers)).toEqual([])
    }
  )

  it.each(FORMS)('names only fields the %s form renders', (name, afform) => {
    const keys = withHearAboutField(afform).fields.map((f) => f.formKey)

    expect(keys).toEqual(
      expect.arrayContaining([...REQUIRED_FIELDS_BY_FORM[name]])
    )
  })

  it('covers every funnel form', () => {
    expect(Object.keys(REQUIRED_FIELDS_BY_FORM).sort()).toEqual(
      FORMS.map(([name]) => name).sort()
    )
  })
})
