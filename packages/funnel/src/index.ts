/**
 * Shared constants for the funnel intake "How did you first hear about
 * Logos?" field (logos-web#90) and the per-form profile label. Single source
 * of truth for:
 *
 * - `apps/web` — the form field label and dropdown options
 *   (`lib/funnel-forms/hear-about-field.ts`), and the profile written into the
 *   Ghost member note (`lib/funnel-newsletter-signup.ts`)
 * - `apps/civi-crm` — the Notion property name and the option-id → label
 *   mapping (`src/lib/notion/maps.ts`), and the Notion `Profile` select
 *   (`src/lib/notion/build-notion-properties.ts`)
 *
 * `./required-fields` and `./form-options` are re-exported here to keep one
 * entry point; `./form-options` holds the option lists the three funnel forms
 * share and the id → label maps `apps/civi-crm` resolves them with.
 *
 * `HEAR_ABOUT_QUESTION` doubles as the name of the select property on the
 * production Notion database, and the option labels are its select options.
 * Rewording the question or the labels therefore requires renaming the
 * property/options in Notion first — see docs/funnel/AGENTS.md.
 */

import { toLabelMap } from './form-options'

export const HEAR_ABOUT_QUESTION = 'How did you first hear about Logos?'

export const HEAR_ABOUT_OPTIONS = [
  { value: '1', label: 'Friend or colleague' },
  { value: '2', label: 'Social media' },
  { value: '3', label: 'Search engine' },
  { value: '4', label: 'Event or conference' },
  { value: '5', label: 'Another community or organization' },
  { value: '6', label: 'Podcast' },
  { value: '7', label: 'News/article/blog' },
  { value: '8', label: 'Other' },
] as const

export type HearAboutOption = (typeof HEAR_ABOUT_OPTIONS)[number]

export const HEAR_ABOUT_MAP = toLabelMap(HEAR_ABOUT_OPTIONS)

/**
 * Profile label per funnel form. These are the option labels of the Notion
 * `Profile` select, so renaming one means renaming the option in Notion first.
 */
export const PROFILE_BY_FORM_NAME = {
  afformCoalitionPartner: 'Coalition Partner',
  afformActivistBuilder: 'Activist Builder',
  afformActivistLeaderSteward: 'Activist Leader / Steward',
} as const

export type ProfileFormName = keyof typeof PROFILE_BY_FORM_NAME

export function isProfileFormName(
  formName: string
): formName is ProfileFormName {
  return formName in PROFILE_BY_FORM_NAME
}

/** `undefined` for unknown forms. */
export function getProfileForForm(formName?: string): string | undefined {
  if (!formName || !isProfileFormName(formName)) return undefined
  return PROFILE_BY_FORM_NAME[formName]
}

export {
  REQUIRED_FIELDS_BY_FORM,
  findInvalidRequiredFields,
  getRequiredFieldsForForm,
} from './required-fields'

export {
  CHAT_SERVICE_MAP,
  CHAT_SERVICE_OPTIONS,
  COUNTRY_MAP,
  COUNTRY_OPTIONS,
  SKILLS_MAP,
  SKILLS_OPTIONS,
  type FunnelFieldOption,
} from './form-options'
