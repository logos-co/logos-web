import { revalidateTag } from 'next/cache'
import { getCaseById, updateCase } from '@/lib/civicrm/cases'
import { updateContact, updateEmail } from '@/lib/civicrm/contacts'
import { CiviCRMError } from '@/lib/civicrm/client'
import { civiConfig } from '@/lib/civicrm/config'
import { getActiveView } from '@/lib/views'
import { getCurrentUserEmail } from '@/lib/auth'
import { computeScorecard } from '@/lib/civicrm/scorecard'
import { logActivity, type FieldChange } from '@/lib/activity-logger'

// GET  /api/cases/[id] — full case detail including contact data and other relationships
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const view = getActiveView()
  try {
    return Response.json(await getCaseById(id, view))
  } catch (err) {
    if (err instanceof CiviCRMError && err.status === 404)
      return Response.json({ error: `Case ${id} not found` }, { status: 404 })
    throw err
  }
}

// PATCH /api/cases/[id] — update case and/or contact fields; fans out to CiviCRM entities
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const view = getActiveView()

  const userEmail = getCurrentUserEmail(req)
  if (!userEmail && process.env.NODE_ENV === 'production')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Record<string, unknown> = await req.json()

  // If any scoring field is present, all 6 must be in the payload
  const hasAnyScoreField = view.scorecardFieldKeys.some((k) => k in body)
  if (hasAnyScoreField) {
    const missing = view.scorecardFieldKeys.filter((k) => !(k in body))
    if (missing.length > 0)
      return Response.json(
        {
          error: `All 6 scoring fields required; missing: ${missing.join(', ')}`,
        },
        { status: 400 }
      )
  }

  // Fetch current state for contactId + before-values (needed for activity log)
  let caseDetail: Awaited<ReturnType<typeof getCaseById>>
  try {
    caseDetail = await getCaseById(id, view)
  } catch (err) {
    if (err instanceof CiviCRMError && err.status === 404)
      return Response.json({ error: `Case ${id} not found` }, { status: 404 })
    throw err
  }
  const { contactId } = caseDetail

  // Build per-entity write payloads
  const caseValues: Record<string, unknown> = {}
  const contactValues: Record<string, unknown> = {}
  let emailValue: string | undefined

  for (const [key, value] of Object.entries(body)) {
    const field = view.fields.find((f) => f.key === key)
    if (
      !field ||
      field.inputType === 'readonly' ||
      field.updateTarget.entity === 'Relationship'
    )
      continue

    if (field.updateTarget.entity === 'Case') {
      caseValues[field.civiPath] = value
    } else if (field.updateTarget.entity === 'Contact') {
      const path = field.civiPath.startsWith(civiConfig.CONTACT_ID_PREFIX)
        ? field.civiPath.slice(civiConfig.CONTACT_ID_PREFIX.length)
        : field.civiPath
      contactValues[path] = value
    } else if (field.updateTarget.entity === 'Email') {
      emailValue = String(value)
    }
  }

  // Inject computed scorecard into the Case payload
  if (hasAnyScoreField) {
    const scores: Record<string, number | null> = {}
    for (const k of view.scorecardFieldKeys) {
      const field = view.fields.find((f) => f.key === k)!
      scores[field.civiPath] = body[k] == null ? null : Number(body[k])
    }
    caseValues['Circle_Case.Scorecard'] = computeScorecard(scores)
  }

  // Fire all writes in parallel
  const writes: [string, Promise<void>][] = []
  if (Object.keys(caseValues).length > 0)
    writes.push(['Case', updateCase(id, caseValues)])
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
      if (
        !field ||
        field.inputType === 'readonly' ||
        field.updateTarget.entity === 'Relationship'
      )
        continue
      changes.push({
        key,
        label: field.label,
        from: caseDetail.fieldValues[key] ?? null,
        to,
      })
    }
    try {
      await logActivity(
        userEmail,
        { type: 'case', caseId: id, contactId },
        changes
      )
    } catch (err) {
      console.error('logActivity failed (mutation succeeded):', err)
    }
  }

  revalidateTag('cases', 'default')
  return Response.json({ ok: true })
}
