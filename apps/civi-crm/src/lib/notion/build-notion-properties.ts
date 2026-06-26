import {
  isAfformIntakeFormName,
  type AfformIntakeFormName,
} from '@/lib/civicrm/afform-case-defaults'

import { NOTION_TEXT_MAX_LENGTH } from './constants'
import {
  CHAT_SERVICE_MAP,
  COUNTRY_MAP,
  BU_MOVEMENT,
  MVMT_STATUS_NEW_LEAD,
  PROFILE_BY_FORM,
  SKILLS_MAP,
} from './maps'

export type NotionPageProperties = Record<string, unknown>

// Each submitted website goes into its own URL column. The first reuses the
// pre-existing `Website` property; the rest fill `Website 2` .. `Website 5`.
// The funnel form caps submissions at five websites (MAX_WEBSITE_ROWS).
export const WEBSITE_PROPERTY_NAMES = [
  'Website',
  'Website 2',
  'Website 3',
  'Website 4',
  'Website 5',
] as const

function toArray(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []
}

function trim(s: unknown): string {
  return s && typeof s === 'string' ? s.trim() : ''
}

function clampText(content: string): string {
  return content.slice(0, NOTION_TEXT_MAX_LENGTH)
}

function richText(content: string): NotionPageProperties {
  return {
    rich_text: [{ type: 'text', text: { content: clampText(content) } }],
  }
}

function optionalRichText(content: string): NotionPageProperties | undefined {
  if (!content) return undefined
  return richText(content)
}

export function resolveOrganizationSelect(
  submitted: string,
  existingOptions: readonly string[]
): string {
  const value = submitted.trim()
  if (!value) return ''
  const lower = value.toLowerCase()
  const match = existingOptions.find((option) => option.toLowerCase() === lower)
  return match ?? value
}

function getBackground(data: Record<string, unknown>): string {
  return (
    trim(data.backgroundPartner) ||
    trim(data.backgroundBuilder) ||
    trim(data.backgroundLeader) ||
    ''
  )
}

function getProfileName(formName: string): string | undefined {
  if (!isAfformIntakeFormName(formName)) return undefined
  return PROFILE_BY_FORM[formName as AfformIntakeFormName]
}

export function buildNotionProperties(
  data: Record<string, unknown>,
  formName: string,
  organizationSelect: string
): NotionPageProperties {
  const name = trim(data.name) || 'Unknown'
  const email = trim(data.email)
  const city = trim(data.city)
  const countryId = trim(data.country)
  const country = COUNTRY_MAP[countryId] ?? countryId

  const background = getBackground(data)
  const techVision = trim(data.techVision)
  const activitiesVision = trim(data.activitiesVision)
  const questions = trim(data.questions)
  const wantsEvents = data.wantsEvents === true
  const wantsNewsletter = data.wantsNewsletter === true

  const skillIds = toArray(data.skills)
  const skillNames = skillIds
    .map((id) => SKILLS_MAP[id] ?? id)
    .filter(Boolean)
    .map((skillName) => ({ name: skillName }))

  const websiteArr = toArray(data.website).map(trim).filter(Boolean)

  const chatArr = toArray(data.chat).map(trim)
  const chatServiceArr = toArray(data.chatService).map(trim)
  const chatPairs = chatArr
    .map((handle, i): string | null => {
      if (!handle) return null
      const svcId = chatServiceArr[i] ?? ''
      const svcLabel = CHAT_SERVICE_MAP[svcId] ?? svcId
      return svcLabel ? `${handle} (${svcLabel})` : handle
    })
    .filter((v): v is string => v !== null)
  const chatStr = chatPairs.join(' | ')

  const profileName = getProfileName(formName)

  const properties: NotionPageProperties = {
    Name: { title: [{ type: 'text', text: { content: clampText(name) } }] },
    BU: { multi_select: [{ name: BU_MOVEMENT }] },
    'Mvmt Status': { select: { name: MVMT_STATUS_NEW_LEAD } },
    'Wants Events': { checkbox: wantsEvents },
    'Wants Newsletter': { checkbox: wantsNewsletter },
    Skills: { multi_select: skillNames },
  }

  if (email) {
    properties['Email/Website'] = { email }
  }
  if (city) {
    properties.City = richText(city)
  }
  if (country) {
    properties.Country = richText(country)
  }
  if (organizationSelect) {
    properties.Organization = { select: { name: organizationSelect } }
  }
  if (profileName) {
    properties.Profile = { select: { name: profileName } }
  }
  websiteArr
    .slice(0, WEBSITE_PROPERTY_NAMES.length)
    .forEach((url, index) => {
      properties[WEBSITE_PROPERTY_NAMES[index]] = { url }
    })
  if (chatStr) {
    properties['Phone or Social Handle'] = { phone_number: chatStr }
  }

  const backgroundProp = optionalRichText(background)
  if (backgroundProp) properties.Background = backgroundProp

  const techVisionProp = optionalRichText(techVision)
  if (techVisionProp) properties['Tech Vision'] = techVisionProp

  const activitiesVisionProp = optionalRichText(activitiesVision)
  if (activitiesVisionProp) properties['Activities Vision'] = activitiesVisionProp

  const questionsProp = optionalRichText(questions)
  if (questionsProp) properties.Questions = questionsProp

  return properties
}
