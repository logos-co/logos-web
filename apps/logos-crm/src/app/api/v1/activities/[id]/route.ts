import { z } from 'zod/v4'

import { updateActivitySchema } from '@/contracts/work'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { deleteActivity, updateActivity } from '@/server/work-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    const actor = await resolveActor(request)
    const input = updateActivitySchema.parse(await request.json())
    return Response.json({ item: await updateActivity(actor, id, input) })
  } catch (error) {
    return apiException(error)
  }
}

/**
 * Soft delete. Returns the note rather than 204 so the caller can render its
 * deleted state in place instead of removing a row the timeline still has.
 */
export async function DELETE(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    const actor = await resolveActor(request)
    return Response.json({ item: await deleteActivity(actor, id) })
  } catch (error) {
    return apiException(error)
  }
}
