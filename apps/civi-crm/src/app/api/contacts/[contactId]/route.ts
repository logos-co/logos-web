import {
  updateContact,
  updateEmail,
  getContactFieldValues,
} from '@/lib/civicrm/contacts'
import { civiConfig } from '@/lib/civicrm/config'
import { getActiveView } from '@/lib/views'
import { getCurrentUserEmail } from '@/lib/auth'
import { logActivity, type FieldChange } from '@/lib/activity-logger'

// PATCH /api/contacts/[contactId]
// Updates Contact Individual fields; fans out to /Contact and /Email in parallel.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params
  const view = getActiveView()

  const userEmail = getCurrentUserEmail(req)
  if (!userEmail && process.env.NODE_ENV === 'production')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Record<string, unknown> = await req.json()

  // Fetch current contact field values before writing (needed for activity log "from")
  const beforeValues = await getContactFieldValues(contactId, view)

  const { CONTACT_ID_PREFIX: prefix } = civiConfig
  const contactValues: Record<string, unknown> = {}
  let emailValue: string | undefined

  for (const [key, value] of Object.entries(body)) {
    const field = view.fields.find((f) => f.key === key)
    if (!field) continue
    if (field.updateTarget.entity === 'Contact') {
      const path = field.civiPath.startsWith(prefix)
        ? field.civiPath.slice(prefix.length)
        : field.civiPath
      contactValues[path] = value
    } else if (field.updateTarget.entity === 'Email') {
      emailValue = String(value)
    }
  }

  const writes: [string, Promise<void>][] = []
  if (Object.keys(contactValues).length > 0)
    writes.push(['Contact', updateContact(contactId, contactValues)])
  if (emailValue !== undefined)
    writes.push(['Email', updateEmail(contactId, emailValue)])

  const results = await Promise.allSettled(writes.map(([, p]) => p))
  const anyFailure = results.some((r) => r.status === 'rejected')

  if (anyFailure) {
    const entityResults = Object.fromEntries(
      writes.map(([entity], i) => [
        entity,
        results[i].status === 'fulfilled'
          ? { ok: true }
          : {
              ok: false,
              error:
                (results[i] as PromiseRejectedResult).reason?.message ??
                'Unknown error',
            },
      ])
    )
    return Response.json({ results: entityResults }, { status: 207 })
  }

  if (userEmail) {
    const changes: FieldChange[] = []
    for (const [key, to] of Object.entries(body)) {
      const field = view.fields.find((f) => f.key === key)
      if (!field) continue
      changes.push({
        key,
        label: field.label,
        from: beforeValues[key] ?? null,
        to,
      })
    }
    try {
      await logActivity(userEmail, { type: 'contact', contactId }, changes)
    } catch (err) {
      console.error('logActivity failed (mutation succeeded):', err)
    }
  }

  return Response.json({ ok: true })
}
