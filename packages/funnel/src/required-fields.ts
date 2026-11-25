/**
 * Required fields per funnel form. Single source of truth: `apps/web` builds
 * its form schema from this list and the intake endpoint validates against it.
 */

import type { ProfileFormName } from './index'

export const REQUIRED_FIELDS_BY_FORM: Record<
  ProfileFormName,
  readonly string[]
> = {
  afformActivistBuilder: [
    'name',
    'city',
    'country',
    'skills',
    'hearAbout',
    'backgroundBuilder',
    'techVision',
    'email',
  ],
  afformCoalitionPartner: [
    'name',
    'city',
    'country',
    'affiliatedOrgs',
    'hearAbout',
    'backgroundPartner',
    'email',
  ],
  afformActivistLeaderSteward: [
    'name',
    'city',
    'country',
    'skills',
    'hearAbout',
    'backgroundLeader',
    'activitiesVision',
    'email',
  ],
}

// Not `isProfileFormName`: that would import `./index`, which re-exports this.
function isKnownForm(formName: string): formName is ProfileFormName {
  return formName in REQUIRED_FIELDS_BY_FORM
}

/** Empty for unknown forms, like `getProfileForForm`. */
export function getRequiredFieldsForForm(formName?: string): readonly string[] {
  if (!formName || !isKnownForm(formName)) return []
  return REQUIRED_FIELDS_BY_FORM[formName]
}

/** Looser than the client's zod `.email()`, so it can only reject non-addresses. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Only the `skills` multi-select may arrive as an array; every other key is a string. */
const ARRAY_FIELDS = new Set(['skills'])

function isFilledString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isAnswered(formKey: string, value: unknown): boolean {
  if (ARRAY_FIELDS.has(formKey)) {
    return Array.isArray(value) && value.some(isFilledString)
  }
  return isFilledString(value)
}

/** Required formKeys left unanswered, plus `email` when it is not an address. */
export function findInvalidRequiredFields(
  formName: string,
  data: Record<string, unknown>
): string[] {
  return getRequiredFieldsForForm(formName).filter((formKey) => {
    const value = data[formKey]
    if (!isAnswered(formKey, value)) return true
    if (formKey !== 'email') return false
    return !EMAIL_PATTERN.test((value as string).trim())
  })
}
