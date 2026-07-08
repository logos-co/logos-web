/**
 * Shared constants for the funnel intake "How did you first hear about
 * Logos?" field (logos-web#90). Single source of truth for:
 *
 * - `apps/web` — the form field label and dropdown options
 *   (`lib/civicrm/hear-about-field.ts`)
 * - `apps/civi-crm` — the Notion property name and the option-id → label
 *   mapping (`src/lib/notion/maps.ts`)
 *
 * `HEAR_ABOUT_QUESTION` doubles as the name of the select property on the
 * production Notion database, and the option labels are its select options.
 * Rewording the question or the labels therefore requires renaming the
 * property/options in Notion first — see docs/funnel/AGENTS.md.
 */

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

export const HEAR_ABOUT_MAP: Record<string, string> = Object.fromEntries(
  HEAR_ABOUT_OPTIONS.map(({ value, label }) => [value, label])
)
