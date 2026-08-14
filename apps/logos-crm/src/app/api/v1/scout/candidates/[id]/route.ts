import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { getScoutCandidate } from '@/server/scout-repository'

interface RouteContext {
  params: Promise<{ id: string }>
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
