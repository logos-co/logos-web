import { scoutCandidateFiltersSchema } from '@/contracts/scout'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import {
  getScoutCandidateStateCounts,
  listScoutCandidates,
} from '@/server/scout-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    await resolveActor(request)
    const url = new URL(request.url)
    const filters = scoutCandidateFiltersSchema.parse({
      state: url.searchParams.get('state') || undefined,
      entityType: url.searchParams.get('entity_type') || undefined,
      q: url.searchParams.get('q') || undefined,
    })
    const [items, stateCounts] = await Promise.all([
      listScoutCandidates(filters),
      getScoutCandidateStateCounts(),
    ])
    return Response.json({ items, stateCounts })
  } catch (error) {
    return apiException(error)
  }
}
