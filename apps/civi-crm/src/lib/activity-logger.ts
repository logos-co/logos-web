import {
  resolveOrCreateContactByEmail,
  getContactById,
} from './civicrm/contacts'
import { createActivity } from './civicrm/activities'
import { civiConfig } from './civicrm/config'

export type FieldChange = {
  key: string
  label: string
  from: unknown
  to: unknown
}

export type ActivityTarget =
  | { type: 'case'; caseId: string; contactId: string }
  | { type: 'contact'; contactId: string }

// Subject must stay short for the CiviCRM activity list UI.
const MAX_SUBJECT_LENGTH = 128

function val(v: unknown): string {
  return String(v ?? '—')
}

// Builds a concise subject line.
// Single change: includes from → to if it fits; strips values if too long.
// Multiple changes: lists field names only (no values) to stay short.
export function buildSubject(
  displayName: string,
  entityName: string,
  changes: FieldChange[]
): string {
  if (changes.length === 1) {
    const c = changes[0]
    const withValues = `*${displayName}* updated ${entityName} "${c.label}": ${val(c.from)} → ${val(c.to)}`
    if (withValues.length <= MAX_SUBJECT_LENGTH) return withValues
    const withoutValues = `*${displayName}* updated ${entityName} "${c.label}"`
    return withoutValues.length <= MAX_SUBJECT_LENGTH
      ? withoutValues
      : withoutValues.slice(0, MAX_SUBJECT_LENGTH)
  }
  const fieldList = changes.map((c) => c.label).join(', ')
  const full = `*${displayName}* updated ${entityName}: ${fieldList}`
  return full.length <= MAX_SUBJECT_LENGTH
    ? full
    : full.slice(0, MAX_SUBJECT_LENGTH - 1) + '…'
}

// Builds the full details block with every piece of context.
export function buildDetails(
  displayName: string,
  userEmail: string,
  entityName: string,
  entityId: string,
  changes: FieldChange[],
  date: string
): string {
  const changeLines = changes.map(
    (c) => `  ${c.label}:\n    Before: ${val(c.from)}\n    After:  ${val(c.to)}`
  )
  return [
    `Editor:  ${displayName} (${userEmail})`,
    `Date:    ${date}`,
    `Entity:  ${entityName} #${entityId}`,
    '',
    'Changes:',
    ...changeLines,
  ].join('\n')
}

// Orchestrates CiviCRM Activity creation on successful mutations.
// Called from PATCH handlers only after all writes succeed.
// Activity creation failure is logged server-side but does not fail the mutation response.
export async function logActivity(
  userEmail: string,
  target: ActivityTarget,
  changes: FieldChange[]
): Promise<void> {
  try {
    const sourceContactId = await resolveOrCreateContactByEmail(userEmail)
    const contact = await getContactById(sourceContactId)
    const displayName =
      String(contact.fieldValues.display_name ?? '').trim() ||
      String(contact.fieldValues.first_name ?? '').trim() ||
      userEmail.split('@')[0]

    const entityName = target.type === 'case' ? 'Case' : 'Contact'
    const entityId = target.type === 'case' ? target.caseId : target.contactId
    const date = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const subject = buildSubject(displayName, entityName, changes)
    const details = buildDetails(
      displayName,
      userEmail,
      entityName,
      entityId,
      changes,
      date
    )

    const payload: Record<string, unknown> = {
      subject,
      details,
      status_id: civiConfig.ACTIVITY_STATUS_COMPLETED_ID,
      source_contact_id: Number(sourceContactId),
    }
    if (target.type === 'case') {
      payload.case_id = Number(target.caseId)
      payload.target_contact_id = [Number(target.contactId)]
    }

    await createActivity(payload)
  } catch (err) {
    console.error('[logActivity] failed to log activity', err)
  }
}
