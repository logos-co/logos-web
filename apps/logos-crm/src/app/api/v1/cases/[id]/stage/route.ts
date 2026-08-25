import { z } from 'zod/v4'

import { updateCaseStageSchema } from '@/contracts/case'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { updateCaseStage } from '@/server/case-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Moves a case along its board. Separate from the case PATCH so a dropped card
 * carries only the stage: a board drag has no opinion about the title, the
 * owner, or the status, and a route that would accept them turns a mis-drop
 * into a silent edit of fields the user never saw.
 */
export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    const actor = await resolveActor(request)
    const input = updateCaseStageSchema.parse(await request.json())
    return Response.json({ item: await updateCaseStage(actor, id, input) })
  } catch (error) {
    return apiException(error)
  }
}
