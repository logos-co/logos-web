import { describe, expect, it } from 'vitest'

import { AFFORM as ACTIVIST_BUILDER_AFFORM } from '../afform-activist-builder'
import { buildFormSchema } from '../contactFormSchema'
import { HEAR_ABOUT_FORM_KEY, withHearAboutField } from '../hear-about-field'

describe('withHearAboutField', () => {
  it('inserts the field right after chatService', () => {
    const afform = withHearAboutField(ACTIVIST_BUILDER_AFFORM)
    const keys = afform.fields.map((f) => f.formKey)

    expect(keys.indexOf(HEAR_ABOUT_FORM_KEY)).toBe(
      keys.indexOf('chatService') + 1
    )
  })

  it('does not mutate the source afform config', () => {
    const before = ACTIVIST_BUILDER_AFFORM.fields.length
    withHearAboutField(ACTIVIST_BUILDER_AFFORM)

    expect(ACTIVIST_BUILDER_AFFORM.fields.length).toBe(before)
  })

  it('is a no-op when the form already defines the field', () => {
    const once = withHearAboutField(ACTIVIST_BUILDER_AFFORM)
    const twice = withHearAboutField(once)

    expect(twice).toBe(once)
    expect(
      twice.fields.filter((f) => f.formKey === HEAR_ABOUT_FORM_KEY)
    ).toHaveLength(1)
  })
})

describe('buildFormSchema hearAbout validation', () => {
  const fields = withHearAboutField(ACTIVIST_BUILDER_AFFORM).fields

  it('rejects submissions without a hearAbout selection', () => {
    const { schema, requiredFields } = buildFormSchema(fields, [
      HEAR_ABOUT_FORM_KEY,
    ])

    expect(requiredFields.has(HEAR_ABOUT_FORM_KEY)).toBe(true)

    const result = schema.safeParse({ [HEAR_ABOUT_FORM_KEY]: '' })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(
      result.error.issues.some((issue) => issue.path[0] === HEAR_ABOUT_FORM_KEY)
    ).toBe(true)
  })

  it('accepts a selected hearAbout option', () => {
    const { schema } = buildFormSchema(fields, [HEAR_ABOUT_FORM_KEY])

    // Other required fields are left out on purpose; only assert that the
    // hearAbout selection itself no longer raises an issue.
    const result = schema.safeParse({ [HEAR_ABOUT_FORM_KEY]: '3' })
    const hearAboutIssues = result.success
      ? []
      : result.error.issues.filter(
          (issue) => issue.path[0] === HEAR_ABOUT_FORM_KEY
        )
    expect(hearAboutIssues).toHaveLength(0)
  })
})
