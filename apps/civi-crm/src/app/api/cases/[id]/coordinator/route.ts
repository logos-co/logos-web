import { revalidateTag } from 'next/cache'
import { getCaseById } from '@/lib/civicrm/cases'
import {
  getCoordinatorRelationship,
  deleteRelationship,
  createCoordinatorRelationship,
} from '@/lib/civicrm/relationships'
import { CiviCRMError } from '@/lib/civicrm/client'
import { getActiveView } from '@/lib/views'
import { getCurrentUserEmail } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'

// PATCH /api/cases/[id]/coordinator
// Swaps the Case Coordinator relationship: deletes the existing record, creates the new one.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const view = getActiveView()

  const userEmail = getCurrentUserEmail(req)
  if (!userEmail && process.env.NODE_ENV === 'production')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { newCoordinatorContactId }: { newCoordinatorContactId: string } =
    await req.json()
  if (!newCoordinatorContactId)
    return Response.json(
      { error: 'newCoordinatorContactId is required' },
      { status: 400 }
    )

  // Fetch lead contactId and existing coordinator in parallel
  let contactId: string
  let oldCoordinator: { id: string; contactId: string } | null
  try {
    const [caseDetail, coordinator] = await Promise.all([
      getCaseById(id, view),
      getCoordinatorRelationship(id),
    ])
    contactId = caseDetail.contactId
    oldCoordinator = coordinator
  } catch (err) {
    if (err instanceof CiviCRMError && err.status === 404)
      return Response.json({ error: `Case ${id} not found` }, { status: 404 })
    throw err
  }

  // Step 1: remove existing coordinator relationship
  if (oldCoordinator) {
    try {
      await deleteRelationship(oldCoordinator.id)
    } catch (err) {
      return Response.json(
        {
          error: `Failed to remove existing coordinator relationship (id: ${oldCoordinator.id}): ${(err as Error).message}`,
        },
        { status: 500 }
      )
    }
  }

  // Step 2: create new coordinator relationship
  try {
    await createCoordinatorRelationship(id, newCoordinatorContactId)
  } catch (err) {
    return Response.json(
      {
        error: `Failed to create new coordinator relationship -- case ${id} now has no coordinator: ${(err as Error).message}`,
      },
      { status: 500 }
    )
  }

  if (userEmail) {
    try {
      await logActivity(userEmail, { type: 'case', caseId: id, contactId }, [
        {
          key: 'assignedTo',
          label: 'Assigned To',
          from: oldCoordinator?.contactId ?? null,
          to: newCoordinatorContactId,
        },
      ])
    } catch (err) {
      console.error('logActivity failed (mutation succeeded):', err)
    }
  }

  revalidateTag('coordinators', 'default')
  revalidateTag('cases', 'default')
  return Response.json({ ok: true })
}
