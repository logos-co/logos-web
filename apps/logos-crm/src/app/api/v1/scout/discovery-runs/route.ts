import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import {
  listRecentDiscoveryRuns,
  runSyntheticDiscovery,
} from '@/server/scout-discovery'

export async function GET(request: Request): Promise<Response> {
  try {
    await resolveActor(request)
    return Response.json({ items: await listRecentDiscoveryRuns() })
  } catch (error) {
    return apiException(error)
  }
}

/**
 * Starts a discovery run. There is nothing to configure because there is
 * nothing to configure yet: the run draws from a built-in catalogue of
 * invented organisations and contacts no external source. A brief, a source
 * policy, and an approval belong to the phase that adds a real adapter.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    return Response.json({ item: await runSyntheticDiscovery(actor) })
  } catch (error) {
    return apiException(error)
  }
}
