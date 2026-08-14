import { HEAR_ABOUT_QUESTION } from '@repo/funnel'

import type { IntakeFormName } from './intake'

/**
 * The property contract the intake endpoint writes today, read back the other
 * way. Renaming any of these in Notion silently breaks the mapping, which is
 * why the property list is snapshotted at the start of the bridge period.
 */
export const NOTION_PROPERTIES = {
  name: 'Name',
  email: 'Email/Website',
  city: 'City',
  country: 'Country',
  organisation: 'Mvmt Organization',
  profile: 'Profile',
  skills: 'Skills',
  phone: 'Phone or Social Handle',
  hearAbout: HEAR_ABOUT_QUESTION,
  techVision: 'Tech Vision',
  activitiesVision: 'Activities Vision',
  wantsNewsletter: 'Wants Newsletter',
  wantsEvents: 'Wants Events',
  websites: ['Website', 'Website 2', 'Website 3', 'Website 4', 'Website 5'],
} as const

/** Notion `Profile` select values, mapped back to the form that produced them. */
const FORM_BY_PROFILE: Record<string, IntakeFormName> = {
  'Coalition Partner': 'afformCoalitionPartner',
  'Activist Builder': 'afformActivistBuilder',
  'Activist Leader / Steward': 'afformActivistLeaderSteward',
}

export interface NotionPage {
  id: string
  last_edited_time?: string
  properties?: Record<string, unknown>
}

interface NotionRichTextItem {
  plain_text?: string
}

function readTitle(property: unknown): string | undefined {
  if (typeof property !== 'object' || property === null) return undefined
  const title = (property as { title?: NotionRichTextItem[] }).title
  if (!Array.isArray(title)) return undefined
  const text = title
    .map((item) => item.plain_text ?? '')
    .join('')
    .trim()
  return text || undefined
}

function readRichText(property: unknown): string | undefined {
  if (typeof property !== 'object' || property === null) return undefined
  const rich = (property as { rich_text?: NotionRichTextItem[] }).rich_text
  if (!Array.isArray(rich)) return undefined
  const text = rich
    .map((item) => item.plain_text ?? '')
    .join('')
    .trim()
  return text || undefined
}

function readEmail(property: unknown): string | undefined {
  if (typeof property !== 'object' || property === null) return undefined
  const email = (property as { email?: string | null }).email
  return email?.trim() || undefined
}

function readPhone(property: unknown): string | undefined {
  if (typeof property !== 'object' || property === null) return undefined
  const phone = (property as { phone_number?: string | null }).phone_number
  return phone?.trim() || undefined
}

function readUrl(property: unknown): string | undefined {
  if (typeof property !== 'object' || property === null) return undefined
  const url = (property as { url?: string | null }).url
  return url?.trim() || undefined
}

function readSelect(property: unknown): string | undefined {
  if (typeof property !== 'object' || property === null) return undefined
  const select = (property as { select?: { name?: string } | null }).select
  return select?.name?.trim() || undefined
}

function readMultiSelect(property: unknown): string[] {
  if (typeof property !== 'object' || property === null) return []
  const items = (property as { multi_select?: Array<{ name?: string }> })
    .multi_select
  if (!Array.isArray(items)) return []
  return items
    .map((item) => item.name?.trim() ?? '')
    .filter((name) => name.length > 0)
}

function readCheckbox(property: unknown): boolean {
  if (typeof property !== 'object' || property === null) return false
  return (property as { checkbox?: boolean }).checkbox === true
}

export interface MappedNotionPage {
  pageId: string
  lastEditedAt: string | null
  formName: IntakeFormName
  name: string
  email?: string
  city?: string
  country?: string
  skills?: string
  affiliatedOrgs?: string
  website: string[]
  chat: string[]
  hearAbout?: string
  techVision?: string
  activitiesVision?: string
  wantsNewsletter: boolean
  wantsEvents: boolean
}

/**
 * Maps a Notion page to the shape the intake pipeline already understands, so
 * an imported applicant and a freshly submitted one become the same kind of
 * record through the same rules.
 *
 * Returns null when the page has no name. Everything else can be missing and
 * still describe a real person to follow up with, but a nameless row is not a
 * record - it is a row somebody started and abandoned.
 */
export function mapNotionPage(page: NotionPage): MappedNotionPage | null {
  const properties = page.properties ?? {}
  const name = readTitle(properties[NOTION_PROPERTIES.name])
  if (!name) return null

  const profile = readSelect(properties[NOTION_PROPERTIES.profile])
  const websites = NOTION_PROPERTIES.websites
    .map((key) => readUrl(properties[key]))
    .filter((value): value is string => Boolean(value))
  const phone = readPhone(properties[NOTION_PROPERTIES.phone])
  const skills = readMultiSelect(properties[NOTION_PROPERTIES.skills])

  return {
    pageId: page.id,
    lastEditedAt: page.last_edited_time ?? null,
    // An unrecognised or missing profile still gets imported, under the funnel
    // that most submissions came through. Dropping the applicant over a select
    // value nobody has curated would be the wrong trade.
    formName:
      (profile ? FORM_BY_PROFILE[profile] : undefined) ??
      'afformCoalitionPartner',
    name,
    email: readEmail(properties[NOTION_PROPERTIES.email]),
    city: readRichText(properties[NOTION_PROPERTIES.city]),
    country: readRichText(properties[NOTION_PROPERTIES.country]),
    skills: skills.length > 0 ? skills.join(', ') : undefined,
    affiliatedOrgs: readRichText(properties[NOTION_PROPERTIES.organisation]),
    website: websites,
    chat: phone ? [phone] : [],
    hearAbout: readSelect(properties[NOTION_PROPERTIES.hearAbout]),
    techVision: readRichText(properties[NOTION_PROPERTIES.techVision]),
    activitiesVision: readRichText(
      properties[NOTION_PROPERTIES.activitiesVision]
    ),
    wantsNewsletter: readCheckbox(
      properties[NOTION_PROPERTIES.wantsNewsletter]
    ),
    wantsEvents: readCheckbox(properties[NOTION_PROPERTIES.wantsEvents]),
  }
}
