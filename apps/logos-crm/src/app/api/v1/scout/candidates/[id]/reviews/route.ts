import { recordScoutReviewSchema } from '@/contracts/scout'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { recordScoutReview } from '@/server/scout-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Records a decision. There is no accept endpoint that writes to the CRM in
 * this phase: acceptance is a reviewed opinion about a synthetic candidate,
 * and the code that would create an organisation does not exist yet.
 */
export async function POST(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const { id } = await context.params
    const input = recordScoutReviewSchema.parse(await request.json())
    return Response.json({ item: await recordScoutReview(actor, id, input) })
  } catch (error) {
    return apiException(error)
  }
}
