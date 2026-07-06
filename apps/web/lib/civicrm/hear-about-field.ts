/**
 * "How did you first hear about Logos?" — web-only funnel field.
 *
 * This field exists on the website and in Notion but has no CiviCRM
 * counterpart: `fieldName` is empty, which keeps it out of the CiviCRM
 * Afform payload (`connect-form-section.tsx` filters it out client-side and
 * `apps/civi-crm` skips defs without a `fieldName` server-side). The question
 * wording and the option list are shared with the Notion side through
 * `@repo/funnel`.
 */

import { HEAR_ABOUT_OPTIONS, HEAR_ABOUT_QUESTION } from '@repo/funnel'

import type { AfformConfig, AfformField } from './types'

export const HEAR_ABOUT_FORM_KEY = 'hearAbout'

export const HEAR_ABOUT_FIELD: AfformField = {
  entity: 'Individual1',
  join: null,
  fieldName: '',
  label: HEAR_ABOUT_QUESTION,
  required: true,
  options: HEAR_ABOUT_OPTIONS.map(({ value, label }) => ({ value, label })),
  inputAttrs: [],
  formKey: HEAR_ABOUT_FORM_KEY,
  inputType: 'select',
}

/**
 * Returns a copy of the Afform config with the "hear about" field inserted
 * right below the chat name / chat service row. No-op when the form already
 * defines the field (e.g. if it ever becomes a real CiviCRM field and shows
 * up in the generated config).
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
