import { bulkScoutReviewSchema } from '@/contracts/scout'
import { apiError, apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { findUndecidableCandidates } from '@/server/scout-discovery'
import { recordScoutReviews } from '@/server/scout-repository'

/**
 * Decides several candidates at once. Accepting is not available here: taking
 * a candidate forward is a per-candidate judgement, and a bulk accept is how a
 * review queue turns into a list nobody read.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const input = bulkScoutReviewSchema.parse(await request.json())

    const undecidable = await findUndecidableCandidates(input.candidateIds)
    if (undecidable.length > 0) {
      return apiError(
        'INVALID_TRANSITION',
        `These candidates cannot be decided in bulk: ${undecidable.join(', ')}.`,
        409
      )
    }

    return Response.json({ item: await recordScoutReviews(actor, input) })
  } catch (error) {
    return apiException(error)
  }
}
