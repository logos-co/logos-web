import { updateScoutCandidateOperationsSchema } from '@/contracts/scout'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import {
  getScoutCandidate,
  updateScoutCandidateOperations,
} from '@/server/scout-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const { id } = await context.params
    const input = updateScoutCandidateOperationsSchema.parse(
      await request.json()
    )
    return Response.json({
      item: await updateScoutCandidateOperations(actor, id, input),
    })
  } catch (error) {
    return apiException(error)
  }
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    await resolveActor(request)
    const { id } = await context.params
    return Response.json({ item: await getScoutCandidate(id) })
  } catch (error) {
    return apiException(error)
  }
}
