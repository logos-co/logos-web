import { z } from 'zod/v4'

import { recordDecisionSchema } from '@/contracts/evaluation'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { recordDecision } from '@/server/evaluation-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    const actor = await resolveActor(request)
    const input = recordDecisionSchema.parse(await request.json())
    return Response.json({ item: await recordDecision(actor, id, input) })
  } catch (error) {
    return apiException(error)
  }
}
