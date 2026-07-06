/**
 * Fetches a CiviCRM Afform layout and writes TypeScript config under lib/civicrm/.
 *
 * Run:     node scripts/fetch-afform-contact-form.mjs [--form afformCircleContactForm]
 * Dry run: node scripts/fetch-afform-contact-form.mjs --dry-run
 * Verify:  node scripts/fetch-afform-contact-form.mjs --verify scripts/afform-contact-form-api-response.json
 *
 * Requires CIVICRM_BASE_URL + CIVICRM_API_KEY in apps/web/.env.local and/or
 * apps/civi-crm/.env.local.
 */

import dotenv from 'dotenv'
import * as fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const civiCrmRoot = path.resolve(root, '..', 'civi-crm')

for (const envPath of [
  path.join(civiCrmRoot, '.env.local'),
  path.join(civiCrmRoot, '.env'),
  path.join(root, '.env.local'),
  path.join(root, '.env'),
]) {
  dotenv.config({ path: envPath })
}

const CIVICRM_BASE_URL = process.env.CIVICRM_BASE_URL?.replace(/\/$/, '')
const CIVICRM_API_KEY = process.env.CIVICRM_API_KEY

const args = process.argv.slice(2)
const VERIFY_IDX = args.indexOf('--verify')
const VERIFY_FILE = VERIFY_IDX !== -1 ? args[VERIFY_IDX + 1] : null
let DRY_RUN = args.includes('--dry-run') || VERIFY_FILE != null
const FORM_IDX = args.indexOf('--form')
const FORM_NAME =
  FORM_IDX !== -1 ? args[FORM_IDX + 1] : 'afformCircleContactForm'

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${CIVICRM_API_KEY}`,
  'X-Requested-With': 'XMLHttpRequest',
}

async function civicrmApi(entity, action, body = {}) {
  const url = `${CIVICRM_BASE_URL}/civicrm/ajax/api4/${entity}/${action}`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok)
    throw new Error(`${entity}/${action}: ${res.status} ${await res.text()}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Read known option group IDs / fallback options from connect-fallbacks.json
// ---------------------------------------------------------------------------

const FALLBACKS_PATH = path.join(
  root,
  'lib',
  'civicrm',
  'connect-fallbacks.json'
)

async function readConnectFallbacks() {
  try {
    const raw = await fs.readFile(FALLBACKS_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      optionGroupIds: parsed.optionGroupIds ?? {},
      options: parsed.options ?? {},
    }
  } catch {
    return { optionGroupIds: {}, options: {} }
  }
}

function readKnownOptionGroupIds(fallbacks) {
  return fallbacks.optionGroupIds ?? {}
}

function readKnownOptions(fallbacks) {
  return fallbacks.options ?? {}
}

// ---------------------------------------------------------------------------
// Option list fetching — resilient to APIs that ignore where clauses
// ---------------------------------------------------------------------------

function normOptionGroupId(id) {
  if (id == null) return null
  return Number(typeof id === 'object' && id?.id != null ? id.id : id)
}

async function fetchOptionValuesForGroup(gid) {
  const ovRes = await civicrmApi('OptionValue', 'get', {
    select: ['option_group_id', 'value', 'label', 'name', 'weight'],
    where: [
      ['option_group_id', '=', gid],
      ['is_active', '=', true],
    ],
    orderBy: { weight: 'ASC' },
    limit: 0,
  })
  let values = ovRes.values || []
  // The API may ignore the where clause and return ALL option values. Filter client-side.
  if (values.length > 100) {
    console.log(
      `        ⚠ Got ${values.length} values (API likely ignored where clause). Filtering to group ${gid}...`
    )
    values = values.filter((v) => normOptionGroupId(v.option_group_id) === gid)
    console.log(`        → ${values.length} values after filtering`)
  }
  return values.map((ov) => ({
    value: String(ov.value),
    label: ov.label || ov.name || String(ov.value),
    name: ov.name,
  }))
}

async function fetchAfformOptionLists(knownGroupIds, knownOptions) {
  const options = { role: [], skills: [], chatService: [], country: [] }

  let roleGid = knownGroupIds.role ?? null
  let skillsGid = knownGroupIds.skills ?? null
  let chatServiceGid = knownGroupIds.chatService ?? null

  // Try to resolve from API, but fall back to known IDs
  console.log('  [1/3] CustomField.get (resolve option_group_ids)...')
  try {
    const customRes = await civicrmApi('CustomField', 'get', {
      select: ['id', 'name', 'custom_group_id.name', 'option_group_id'],
      where: [['custom_group_id.extends', 'IN', ['Individual', 'Contact']]],
    })
    const customFields = (customRes.values || []).filter(
      (cf) => cf.option_group_id != null
    )
    console.log(
      `        → ${customRes.values?.length ?? 0} custom fields, ${customFields.length} with option_group_id`
    )

    const byKey = {}
    for (const cf of customFields) {
      const groupName = (cf['custom_group_id.name'] ?? '').replace(/\s+/g, '_')
      const fieldName = (cf.name ?? '').replace(/\s+/g, '_')
      byKey[`${groupName}.${fieldName}`] = normOptionGroupId(cf.option_group_id)
    }

    const apiRoleGid = byKey['Contacts_Custom_Fields.Role'] ?? null
    const apiSkillsGid = byKey['Skills_Socials.Skills_Experience'] ?? null
    if (apiRoleGid != null) roleGid = apiRoleGid
    if (apiSkillsGid != null) skillsGid = apiSkillsGid
    console.log(
      `        API: role=${apiRoleGid}, skills=${apiSkillsGid} | Using: role=${roleGid}, skills=${skillsGid}`
    )
  } catch (e) {
    console.log(`        error: ${e.message}`)
    console.log(`        Using known IDs: role=${roleGid}, skills=${skillsGid}`)
  }

  // Chat service: try InstantMessenger.getFields, then OptionGroup.get, then known ID
  console.log('  [2/3] Chat service option group...')
  if (chatServiceGid == null) {
    try {
      const imFieldsRes = await civicrmApi('InstantMessenger', 'getFields', {
        select: ['name', 'option_group_id'],
      })
      const providerField = (imFieldsRes.values || []).find(
        (f) => f.name === 'provider_id'
      )
      if (providerField?.option_group_id != null) {
        chatServiceGid = normOptionGroupId(providerField.option_group_id)
        console.log(
          `        InstantMessenger.getFields → chatServiceGid=${chatServiceGid}`
        )
      }
    } catch (e) {
      console.log(`        InstantMessenger.getFields failed: ${e.message}`)
    }
  }
  if (chatServiceGid != null) {
    console.log(`        Using chatServiceGid=${chatServiceGid}`)
  } else {
    console.log(
      '        No chatServiceGid resolved. Will use fallback options.'
    )
  }

  // Fetch OptionValues for each resolved group
  console.log('  [3/3] OptionValue.get...')
  const toFetch = {
    role: roleGid,
    skills: skillsGid,
    chatService: chatServiceGid,
  }
  for (const [key, gid] of Object.entries(toFetch)) {
    if (gid == null) {
      console.log(
        `        ${key}: no group ID, using known options (${knownOptions[key]?.length ?? 0})`
      )
      if (knownOptions[key]?.length) options[key] = knownOptions[key]
      continue
    }
    try {
      const vals = await fetchOptionValuesForGroup(gid)
      console.log(
        `        ${key} (group ${gid}): ${vals.length} options (${vals.map((o) => o.label).join(', ')})`
      )
      if (vals.length > 0) {
        options[key] = vals
      } else if (knownOptions[key]?.length) {
        console.log(
          `        ${key}: API returned 0 values, keeping known options (${knownOptions[key].length})`
        )
        options[key] = knownOptions[key]
      }
    } catch (e) {
      console.log(`        ${key}: error fetching group ${gid}: ${e.message}`)
      if (knownOptions[key]?.length) options[key] = knownOptions[key]
    }
  }

  // Fetch country list
  console.log('  [4/4] Country.get...')
  try {
    const countryRes = await civicrmApi('Country', 'get', {
      select: ['id', 'name', 'iso_code'],
      where: [['is_active', '=', true]],
      orderBy: { name: 'ASC' },
      limit: 0,
    })
    const countries = (countryRes.values || []).map((c) => ({
      value: String(c.id),
      label: c.name,
      name: c.iso_code,
    }))
    console.log(`        ${countries.length} countries`)
    if (countries.length > 0) options.country = countries
  } catch (e) {
    console.log(`        Country.get failed: ${e.message}`)
  }

  return options
}

// ---------------------------------------------------------------------------
// Layout parsing
// ---------------------------------------------------------------------------

const FIELD_TO_FORM_KEY = [
  [
    { name: 'Contacts_Custom_Fields.Role', join: null },
    { formKey: 'role', inputType: 'select' },
  ],
  [
    { name: 'first_name', join: null },
    { formKey: 'name', inputType: 'text' },
  ],
  [
    { name: 'city', join: 'Address' },
    { formKey: 'city', inputType: 'text' },
  ],
  [
    { name: 'country_id', join: 'Address' },
    { formKey: 'country', inputType: 'select', label: 'Country' },
  ],
  [
    { name: 'Skills_Socials.Skills_Experience', join: null },
    { formKey: 'skills', inputType: 'select' },
  ],
  [
    { name: 'email', join: 'Email' },
    { formKey: 'email', inputType: 'email' },
  ],
  [
    { name: 'Skills_Socials.Affiliated_Organisations', join: null },
    { formKey: 'affiliatedOrgs', inputType: 'text' },
  ],
  [
    { name: 'url', join: 'Website' },
    { formKey: 'website', inputType: 'text' },
  ],
  [
    { name: 'name', join: 'IM' },
    { formKey: 'chat', inputType: 'text' },
  ],
  [
    { name: 'provider_id', join: 'IM' },
    { formKey: 'chatService', inputType: 'select' },
  ],
  [
    { name: 'note', join: 'Note' },
    { formKey: 'openText', inputType: 'textarea' },
  ],
  [
    { name: 'Skills_Socials.Informed_about_events_in_my_city', join: null },
    { formKey: 'wantsEvents', inputType: 'checkbox' },
  ],
  [
    { name: 'Skills_Socials.Subscribed_to_Logos_Newsletter', join: null },
    { formKey: 'wantsNewsletter', inputType: 'checkbox' },
  ],
  [
    {
      name: 'Skills_Socials.Tell_us_a_bit_about_your_background_the_kinds_of_things_you_like',
      join: null,
    },
    { formKey: 'backgroundBuilder', inputType: 'textarea' },
  ],
  [
    {
      name: 'Skills_Socials.What_types_of_technologies_do_you_envision_can_help_your_local_c',
      join: null,
    },
    { formKey: 'techVision', inputType: 'textarea' },
  ],
  [
    {
      name: 'Skills_Socials.Tell_us_a_bit_about_your_background_what_kind_of_community_or_lo',
      join: null,
    },
    { formKey: 'backgroundLeader', inputType: 'textarea' },
  ],
  [
    {
      name: 'Skills_Socials.What_types_of_organized_activities_do_you_envision_doing_to_impa',
      join: null,
    },
    { formKey: 'activitiesVision', inputType: 'textarea' },
  ],
  [
    {
      name: 'Skills_Socials.Tell_us_about_your_organization_community_or_project_what_proble',
      join: null,
    },
    { formKey: 'backgroundPartner', inputType: 'textarea' },
  ],
  [
    {
      name: 'Skills_Socials.What_else_would_you_like_us_to_know_What_questions_do_you_have_f',
      join: null,
    },
    { formKey: 'questions', inputType: 'textarea' },
  ],
  [
    { name: 'Circle_Case.Profile', join: null },
    { formKey: 'caseProfile', inputType: 'hidden' },
  ],
  [
    { name: 'Circle_Case.Lead_Source', join: null },
    { formKey: 'caseLeadSource', inputType: 'hidden' },
  ],
]

/** Auto-generate a camelCase formKey for fields not in the explicit mapping. */
function autoFormKey(fieldName) {
  const base = fieldName.includes('.') ? fieldName.split('.').pop() : fieldName
  return base
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/_/g, '')
    .slice(0, 40)
}

function getFormKeyAndType(fieldName, join, defn = {}) {
  const entry = FIELD_TO_FORM_KEY.find(
    ([key]) => key.name === fieldName && key.join === join
  )
  if (entry) {
    const result = { ...entry[1] }
    if (!result.label) delete result.label
    return result
  }
  const key = autoFormKey(fieldName)
  const inputType =
    defn.input_type === 'TextArea' || (defn.label && defn.label.length > 80)
      ? 'textarea'
      : 'text'
  return { formKey: key, inputType }
}

function extractFields(
  children,
  context = { entity: 'Individual1', join: null }
) {
  const fields = []
  if (!Array.isArray(children)) return fields
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (node['#tag'] === 'af-field') {
      const defn = node.defn || {}
      const mapped = getFormKeyAndType(node.name, context.join, defn)
      const { formKey, inputType, label: mappedLabel } = mapped
      const fieldMeta = {
        entity: context.entity,
        join: context.join,
        fieldName: node.name,
        label: mappedLabel || defn.label || node.name,
        required: !!defn.required,
        options: defn.options ?? null,
        inputAttrs: defn.input_attrs ?? [],
        ...(formKey && { formKey, inputType }),
      }
      if (formKey === 'website') fieldMeta.repeatable = true
      fields.push(fieldMeta)
      continue
    }
    if (node['#tag'] === 'div' && node['af-join']) {
      fields.push(
        ...extractFields(node['#children'] ?? [], {
          ...context,
          join: node['af-join'],
        })
      )
      continue
    }
    if (node['af-fieldset'] && node['#children']) {
      fields.push(
        ...extractFields(node['#children'], {
          ...context,
          entity: node['af-fieldset'],
        })
      )
      continue
    }
    if (node['#children']) {
      fields.push(...extractFields(node['#children'], context))
    }
  }
  return fields
}

function getTextFromChildren(children) {
  if (!Array.isArray(children)) return ''
  return children
    .map((c) => c?.['#text'] ?? '')
    .filter(Boolean)
    .join('')
    .trim()
}

function getTextRecursive(children) {
  if (!Array.isArray(children)) return ''
  const parts = children
    .map((c) => {
      if (!c || typeof c !== 'object') return ''
      if (c['#text']) return c['#text']
      if (c['#children']) return getTextRecursive(c['#children'])
      return ''
    })
    .filter(Boolean)
  return parts
    .join(' ')
    .trim()
    .replace(/\s*&nbsp;\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findFirstTextInLayout(children, tag) {
  if (!Array.isArray(children)) return ''
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (node['#tag'] === tag)
      return getTextFromChildren(node['#children'] ?? [])
    if (node['#children']) {
      const found = findFirstTextInLayout(node['#children'], tag)
      if (found) return found
    }
  }
  return ''
}

function findAllTextByTag(children, tag, out = []) {
  if (!Array.isArray(children)) return out
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (node['#tag'] === tag)
      out.push(getTextFromChildren(node['#children'] ?? []))
    if (node['#children']) findAllTextByTag(node['#children'], tag, out)
  }
  return out
}

function decodeHtmlEntities(text) {
  return String(text ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeParagraphText(text) {
  return String(text ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function isAfMarkupNode(node) {
  return (
    node &&
    typeof node === 'object' &&
    String(node.class ?? '').includes('af-markup')
  )
}

function hasNestedAfMarkup(children) {
  if (!Array.isArray(children)) return false
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (isAfMarkupNode(node)) return true
    if (node['#children'] && hasNestedAfMarkup(node['#children'])) return true
  }
  return false
}

function extractInlineMarkupText(children) {
  if (!Array.isArray(children)) return ''
  return children
    .map((node) => {
      if (!node || typeof node !== 'object') return ''
      if (node['#text']) return node['#text']
      if (node['#tag'] === 'a' && node.href) {
        const label =
          extractInlineMarkupText(node['#children'] ?? []).trim() || node.href
        return `[${label}](${node.href})`
      }
      if (node['#children']) return extractInlineMarkupText(node['#children'])
      return ''
    })
    .join('')
}

function collectLeafAfMarkupParagraphs(children, out = []) {
  if (!Array.isArray(children)) return out
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (isAfMarkupNode(node)) {
      const childNodes = node['#children'] ?? []
      if (hasNestedAfMarkup(childNodes)) {
        collectLeafAfMarkupParagraphs(childNodes, out)
      } else {
        const text = normalizeParagraphText(extractInlineMarkupText(childNodes))
        if (text) out.push(text)
      }
    } else if (node['#children']) {
      collectLeafAfMarkupParagraphs(node['#children'], out)
    }
  }
  return out
}

function extractIntroParagraphs(children, pageHeading = '') {
  return collectLeafAfMarkupParagraphs(children)
    .flatMap((text) =>
      text
        .split(/\n+/)
        .map((part) => normalizeParagraphText(part))
        .filter(Boolean)
    )
    .filter((text) => {
      if (/privacy|consent/i.test(text)) return false
      if (pageHeading && text === pageHeading) return false
      return true
    })
}

function findAllAfMarkupBlocks(children, out = []) {
  if (!Array.isArray(children)) return out
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (String(node.class ?? '').includes('af-markup')) {
      out.push({
        text: decodeHtmlEntities(getTextRecursive(node['#children'] ?? [])),
        link: findFirstLinkHref(node['#children'] ?? []) || '',
      })
    }
    if (node['#children']) findAllAfMarkupBlocks(node['#children'], out)
  }
  return out
}

function findTextByClass(children, className) {
  if (!Array.isArray(children)) return ''
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (String(node.class ?? '').includes(className))
      return getTextRecursive(node['#children'] ?? [])
    if (node['#children']) {
      const found = findTextByClass(node['#children'], className)
      if (found) return found
    }
  }
  return ''
}

function findFirstLinkHrefByClass(children, className) {
  if (!Array.isArray(children)) return ''
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (String(node.class ?? '').includes(className))
      return findFirstLinkHref(node['#children'] ?? []) || ''
    if (node['#children']) {
      const found = findFirstLinkHrefByClass(node['#children'], className)
      if (found) return found
    }
  }
  return ''
}

function findFirstLinkHref(children) {
  if (!Array.isArray(children)) return ''
  for (const node of children) {
    if (!node || typeof node !== 'object') continue
    if (node['#tag'] === 'a' && node.href) return node.href
    if (node['#children']) {
      const found = findFirstLinkHref(node['#children'])
      if (found) return found
    }
  }
  return ''
}

function extractPageCopy(layout) {
  const result = {
    pageHeading: '',
    pageIntro: '',
    pagePrivacy: '',
    pagePrivacyLink: '',
  }
  if (!Array.isArray(layout)) return result
  for (const node of layout) {
    if (!node?.['#children']) continue
    const kids = node['#children']
    result.pageHeading = decodeHtmlEntities(findFirstTextInLayout(kids, 'h1'))
    const allParagraphs = findAllTextByTag(kids, 'p', []).map(
      decodeHtmlEntities
    )
    const markupBlocks = findAllAfMarkupBlocks(kids)
    const privacyBlock = markupBlocks.find((b) =>
      /privacy|consent/i.test(b.text)
    )
    const introBlock = markupBlocks.find(
      (b) => !/privacy|consent/i.test(b.text)
    )
    const introParagraphs = extractIntroParagraphs(kids, result.pageHeading)
    result.pageIntro =
      (introParagraphs.length ? introParagraphs.join('\n\n') : '') ||
      introBlock?.text ||
      allParagraphs.join('\n\n') ||
      ''
    result.pagePrivacy = privacyBlock?.text || ''
    result.pagePrivacyLink = privacyBlock?.link || ''
    if (!result.pagePrivacy && allParagraphs.length > 1) {
      result.pagePrivacy = allParagraphs[allParagraphs.length - 1]
    }
    if (result.pageHeading || result.pageIntro || result.pagePrivacy) break
  }
  return result
}

// ---------------------------------------------------------------------------
// Sync option fallbacks used when the API returns empty lists
// ---------------------------------------------------------------------------

async function syncConnectFallbacks(afformOptions) {
  let fallbacks
  try {
    fallbacks = JSON.parse(await fs.readFile(FALLBACKS_PATH, 'utf8'))
  } catch {
    fallbacks = { optionGroupIds: {}, options: {} }
  }

  const mergedOptions = {
    ...fallbacks.options,
    role: afformOptions.role?.length
      ? afformOptions.role
      : (fallbacks.options?.role ?? []),
    skills: afformOptions.skills?.length
      ? afformOptions.skills
      : (fallbacks.options?.skills ?? []),
    chatService: afformOptions.chatService?.length
      ? afformOptions.chatService
      : (fallbacks.options?.chatService ?? []),
    country: afformOptions.country?.length
      ? afformOptions.country
      : (fallbacks.options?.country ?? []),
  }

  const next = { ...fallbacks, options: mergedOptions }
  const newJson = JSON.stringify(next, null, 2) + '\n'
  const oldJson = JSON.stringify(fallbacks, null, 2) + '\n'

  if (newJson === oldJson) {
    console.log('  connect-fallbacks.json: no changes')
    return
  }

  if (DRY_RUN) {
    console.log('  [dry-run] Would update connect-fallbacks.json options')
    return
  }

  await fs.writeFile(FALLBACKS_PATH, newJson, 'utf8')
  console.log('  Synced options to lib/civicrm/connect-fallbacks.json')
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const CORE_FORM_KEYS = ['name', 'email']

function validateOutput(out, options) {
  const errors = []
  const warnings = []
  if (!out.formName) errors.push('formName is empty')
  if (out.fields.length === 0) errors.push('No fields parsed from layout')
  const parsedKeys = out.fields.map((f) => f.formKey).filter(Boolean)
  for (const key of CORE_FORM_KEYS) {
    if (!parsedKeys.includes(key))
      warnings.push(`Missing core formKey "${key}"`)
  }
  if (!out.pageHeading) warnings.push('pageHeading is empty')
  if (!options.skills?.length && parsedKeys.includes('skills'))
    warnings.push('skills options are empty')
  if (!options.chatService?.length && parsedKeys.includes('chatService'))
    warnings.push('chatService options are empty')
  return { errors, warnings }
}

// ---------------------------------------------------------------------------
// processForm
// ---------------------------------------------------------------------------

async function processForm(form, afformOptions) {
  const layout = form.layout
  if (!layout || !Array.isArray(layout))
    throw new Error('No layout array on form')

  const allFields = []
  for (const node of layout) {
    if (node?.['#children']) allFields.push(...extractFields(node['#children']))
  }

  const { pageHeading, pageIntro, pagePrivacy, pagePrivacyLink } =
    extractPageCopy(layout)

  const out = {
    formName: form.name,
    title: form.title,
    serverRoute: form.server_route,
    confirmationMessage:
      form.confirmation_message ??
      "Thank you for registering, we'll be in touch soon.",
    submitEnabled: form.submit_enabled !== false,
    createSubmission: form.create_submission !== false,
    pageHeading: pageHeading || form.title || 'Contact',
    pageIntro: pageIntro || '',
    pagePrivacy: pagePrivacy || '',
    pagePrivacyLink: pagePrivacyLink || '',
    fields: allFields,
  }

  console.log('\n--- Parsed form summary ---')
  console.log(`  formName:     ${out.formName}`)
  console.log(`  title:        ${out.title}`)
  console.log(`  fields:       ${allFields.length}`)
  console.log(
    `  formKeys:     ${allFields
      .map((f) => f.formKey)
      .filter(Boolean)
      .join(', ')}`
  )
  console.log(`  pageHeading:  ${out.pageHeading}`)
  console.log(
    `  pageIntro:    ${out.pageIntro.slice(0, 80)}${out.pageIntro.length > 80 ? '...' : ''}`
  )
  console.log(
    `  pagePrivacy:  ${out.pagePrivacy.slice(0, 80)}${out.pagePrivacy.length > 80 ? '...' : ''}`
  )
  console.log(`  privacyLink:  ${out.pagePrivacyLink}`)
  console.log(`\n--- Options summary ---`)
  console.log(
    `  role:        ${afformOptions.role?.length ?? 0} (${afformOptions.role?.map((o) => o.label).join(', ') || 'none'})`
  )
  console.log(`  skills:      ${afformOptions.skills?.length ?? 0}`)
  console.log(
    `  chatService: ${afformOptions.chatService?.length ?? 0} (${afformOptions.chatService?.map((o) => o.label).join(', ') || 'none'})`
  )

  const { errors, warnings } = validateOutput(out, afformOptions)
  if (warnings.length) {
    console.log('\n⚠ Warnings:')
    for (const w of warnings) console.log(`  - ${w}`)
  }
  if (errors.length) {
    console.error('\n✗ Validation errors (aborting — no files written):')
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }

  const outDir = path.join(root, 'lib', 'civicrm')
  const slug = form.name
    .replace(/^afform/, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
  const fileName = `afform-${slug || 'form'}.ts`
  const jsPath = path.join(outDir, fileName)

  const jsContent = `/**
 * ${out.title || form.name} Afform definition.
 * Generated by scripts/fetch-afform-contact-form.mjs — do not edit by hand.
 * Regenerate: node scripts/fetch-afform-contact-form.mjs --form ${form.name}
 */

export const AFFORM = ${JSON.stringify(out, null, 2)};

export const AFFORM_NAME = ${JSON.stringify(form.name)};

export const AFFORM_FIELDS = ${JSON.stringify(allFields, null, 2)};

export const AFFORM_OPTIONS = ${JSON.stringify(afformOptions, null, 2)};
`

  if (DRY_RUN) {
    console.log(`\n[dry-run] Would write ${fileName}`)
    try {
      const existing = await fs.readFile(jsPath, 'utf8')
      console.log(
        existing === jsContent
          ? '[dry-run] No changes'
          : '[dry-run] File WOULD change'
      )
    } catch {
      console.log('[dry-run] File is new')
    }
    await syncConnectFallbacks(afformOptions)
    return
  }

  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(jsPath, jsContent, 'utf8')
  console.log(`\nWrote ${jsPath}`)
  await syncConnectFallbacks(afformOptions)
}

// ---------------------------------------------------------------------------
// Afform.get — handles APIs that ignore the where clause
// ---------------------------------------------------------------------------

async function fetchFormFromApi() {
  console.log(`Fetching Afform.get (name = ${FORM_NAME})...`)
  const res = await civicrmApi('Afform', 'get', {
    where: [['name', '=', FORM_NAME]],
    select: [
      'name',
      'title',
      'server_route',
      'layout',
      'confirmation_type',
      'confirmation_message',
      'submit_enabled',
      'create_submission',
    ],
  })

  const allForms = res.values ?? []
  console.log(`  → ${allForms.length} form(s) returned`)

  let form = allForms.find((f) => f.name === FORM_NAME)
  if (!form && allForms.length === 1) form = allForms[0]
  if (!form) {
    console.error(`Form ${FORM_NAME} not found in API response.`)
    console.error(
      `Forms returned: ${allForms
        .map((f) => f.name)
        .filter(Boolean)
        .join(', ')}`
    )
    process.exit(1)
  }

  if (!form.layout || !Array.isArray(form.layout)) {
    console.error('Form found but layout is missing or not an array.')
    console.error('The API key may lack permission to read layouts.')
    process.exit(1)
  }

  console.log(`  form.name:    ${form.name}`)
  console.log(`  form.title:   ${form.title}`)
  console.log(`  layout nodes: ${form.layout.length}`)
  return form
}

// ---------------------------------------------------------------------------
// Verify mode: parse snapshot file without API
// ---------------------------------------------------------------------------

async function loadFormFromFile(filePath) {
  const content = await fs.readFile(path.resolve(filePath), 'utf8')
  const parsed = JSON.parse(content)
  const list = Array.isArray(parsed) ? parsed : [parsed]
  const form = list.find((f) => f?.name === FORM_NAME)
  if (!form) {
    console.error(`No form named ${FORM_NAME} in ${filePath}`)
    console.error(
      `Forms found: ${list
        .map((f) => f?.name)
        .filter(Boolean)
        .join(', ')}`
    )
    process.exit(1)
  }
  return form
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const fallbacks = await readConnectFallbacks()
  const knownGroupIds = readKnownOptionGroupIds(fallbacks)
  const knownOptions = readKnownOptions(fallbacks)
  console.log(
    `Known option group IDs from connect-fallbacks.json: ${JSON.stringify(knownGroupIds)}`
  )
  console.log(
    `Known options: role=${knownOptions.role?.length ?? 0}, skills=${knownOptions.skills?.length ?? 0}, chatService=${knownOptions.chatService?.length ?? 0}`
  )

  if (VERIFY_FILE) {
    console.log(
      `\n--- Verify mode: parsing ${VERIFY_FILE} (no API calls, no writes) ---`
    )
    const form = await loadFormFromFile(VERIFY_FILE)
    console.log(`Loaded form "${form.name}" from file`)
    await processForm(form, knownOptions)
    console.log('\n--- Verify complete ---')
    return
  }

  if (!CIVICRM_BASE_URL || !CIVICRM_API_KEY) {
    console.error('Missing CIVICRM_BASE_URL or CIVICRM_API_KEY.')
    console.error(
      'Set them in apps/civi-crm/.env.local (or apps/web/.env.local) and run: pnpm fetch:afform-contact'
    )
    process.exit(1)
  }

  if (DRY_RUN) console.log('\n--- Dry-run mode: no files will be written ---')
  console.log('')

  const form = await fetchFormFromApi()

  console.log('\nFetching option lists (role, skills, chatService)...')
  const options = await fetchAfformOptionLists(knownGroupIds, knownOptions)

  await processForm(form, options)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
