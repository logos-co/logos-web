/**
 * "How did you first hear about Logos?" — funnel form field.
 *
 * The question wording and the option list are shared with the Notion side
 * through `@repo/funnel`: the intake endpoint on `apps/civi-crm` resolves the
 * submitted option id back to its label and rejects ids it does not know.
 */

import { HEAR_ABOUT_OPTIONS, HEAR_ABOUT_QUESTION } from '@repo/funnel'

import type { AfformConfig, AfformField } from './types'

export const HEAR_ABOUT_FORM_KEY = 'hearAbout'

export const HEAR_ABOUT_FIELD: AfformField = {
  formKey: HEAR_ABOUT_FORM_KEY,
  label: HEAR_ABOUT_QUESTION,
  inputType: 'select',
  required: true,
  options: HEAR_ABOUT_OPTIONS.map(({ value, label }) => ({ value, label })),
}

/**
 * Returns a copy of the form config with the "hear about" field inserted right
 * below the chat name / chat service row. No-op when the form already defines
 * the field.
 */
export function withHearAboutField(afform: AfformConfig): AfformConfig {
  const fields = afform.fields ?? []
  if (fields.some((f) => f.formKey === HEAR_ABOUT_FORM_KEY)) return afform

  const chatServiceIndex = fields.findIndex(
    (f) => f.formKey === 'chatService'
  )
  const insertAt = chatServiceIndex === -1 ? fields.length : chatServiceIndex + 1

  return {
    ...afform,
    fields: [
      ...fields.slice(0, insertAt),
      HEAR_ABOUT_FIELD,
      ...fields.slice(insertAt),
    ],
  }
}
