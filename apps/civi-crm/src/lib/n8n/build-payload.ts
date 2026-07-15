import {
  CHAT_SERVICE_MAP,
  COUNTRY_MAP,
  HEAR_ABOUT_MAP,
  SKILLS_MAP,
} from '@/lib/notion/maps'

// Each id-based field is sent to n8n as its raw selected id merged with the
// resolved label, so the webhook sees both the id and what it means without
// having to rebuild any id->label mapping.
export type IdLabel = { id: string; label: string }

// A chat handle paired with the service it belongs to. `chat` and `chatService`
// arrive as two index-aligned parallel arrays; we merge them so each handle
// stays connected to its service and the webhook needn't re-pair them.
export type ChatEntry = { handle: string; service?: IdLabel }

// The web client (buildInitialData) seeds a hardcoded, never-populated `socials`
// key that is always '' and has no matching form field, so it is dropped here.
const STRAY_KEYS = ['socials'] as const

// Trims to a list of strings while preserving index/length (no empties removed),
// so parallel arrays like chat/chatService stay aligned.
function toTrimmedList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value == null ? [] : [value]
  return raw.map((v) =>
    typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()
  )
}

// Drops empty entries; used for id-based single/multi fields.
function toIds(value: unknown): string[] {
  return toTrimmedList(value).filter(Boolean)
}

// Falls back to label = id for unknown ids so a raw id is never dropped.
function resolve(id: string, map: Record<string, string>): IdLabel {
  return { id, label: map[id] ?? id }
}

function resolveMulti(value: unknown, map: Record<string, string>): IdLabel[] {
  return toIds(value).map((id) => resolve(id, map))
}

function resolveScalar(
  value: unknown,
  map: Record<string, string>
): IdLabel | undefined {
  const id = toIds(value)[0]
  return id ? resolve(id, map) : undefined
}

// Merges the index-aligned chat handles and chat services into one array,
// dropping rows with no handle. Mirrors the pairing in build-notion-properties.
function buildChat(formData: Record<string, unknown>): ChatEntry[] {
  const handles = toTrimmedList(formData.chat)
  const serviceIds = toTrimmedList(formData.chatService)
  return handles
    .map((handle, i): ChatEntry => {
      const svcId = serviceIds[i] ?? ''
      return svcId ? { handle, service: resolve(svcId, CHAT_SERVICE_MAP) } : { handle }
    })
    .filter((entry) => entry.handle !== '')
}

// Builds the JSON body posted to the steward n8n webhook: the full submitted
// form payload with plain text/boolean fields passed through unchanged, the
// id-based fields (country, skills, hearAbout) replaced by merged { id, label }
// shapes, the chat handles merged with their services, the stray `socials` seed
// dropped, plus the form name as metadata.
export function buildN8nPayload(
  formData: Record<string, unknown>,
  formName: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...formData, formName }

  for (const key of STRAY_KEYS) {
    delete payload[key]
  }

  if ('country' in formData) {
    const country = resolveScalar(formData.country, COUNTRY_MAP)
    if (country) payload.country = country
  }
  if ('skills' in formData) {
    payload.skills = resolveMulti(formData.skills, SKILLS_MAP)
  }
  if ('hearAbout' in formData) {
    const hearAbout = resolveScalar(formData.hearAbout, HEAR_ABOUT_MAP)
    if (hearAbout) payload.hearAbout = hearAbout
  }
  // Replace the two parallel chat arrays with a single merged one.
  if ('chat' in formData || 'chatService' in formData) {
    payload.chat = buildChat(formData)
    delete payload.chatService
  }

  return payload
}
