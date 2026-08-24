/**
 * Dropdown options shared by the three funnel forms, in the shape
 * `ConnectFormSection` looks them up in: keyed by `formKey`, so a field with no
 * inline `options` resolves here.
 *
 * The lists themselves live in `@repo/funnel` — the intake endpoint on
 * `apps/civi-crm` resolves the submitted ids back to labels.
 */

import {
  CHAT_SERVICE_OPTIONS,
  COUNTRY_OPTIONS,
  SKILLS_OPTIONS,
} from '@repo/funnel'

import type { AfformOptions } from './types'

export const AFFORM_OPTIONS: AfformOptions = {
  skills: SKILLS_OPTIONS,
  chatService: CHAT_SERVICE_OPTIONS,
  country: COUNTRY_OPTIONS,
}
