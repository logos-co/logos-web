import { z } from 'zod/v4'

import { updateCaseIntegrationSchema } from '@/contracts/case'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { updateCaseIntegration } from '@/server/case-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Sets the integration track. Its own route for the same reason the stage move
 * has one: the track is a second axis over the case, and folding it into the
 * case PATCH would let one request quietly change two independent facts.
 */
export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    const actor = await resolveActor(request)
    const input = updateCaseIntegrationSchema.parse(await request.json())
    return Response.json({
      item: await updateCaseIntegration(actor, id, input),
    })
  } catch (error) {
    return apiException(error)
  }
}
