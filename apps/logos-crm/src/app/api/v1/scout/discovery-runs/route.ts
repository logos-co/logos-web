import { z } from 'zod/v4'

import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { listRecentDiscoveryRuns, runDiscovery } from '@/server/scout-discovery'
import { areSourcesEnabled } from '@/server/scout/source-fetch'

const requestSchema = z.object({
  query: z.string().trim().min(2).max(80).optional(),
  mode: z.enum(['synthetic', 'sources']).optional(),
})

export async function GET(request: Request): Promise<Response> {
  try {
    await resolveActor(request)
    return Response.json({
      items: await listRecentDiscoveryRuns(),
      sourcesEnabled: areSourcesEnabled(),
    })
  } catch (error) {
    return apiException(error)
  }
}

/**
 * Starts a discovery run.
 *
 * With a query and approved sources enabled, this reads the sources. Without
 * either, it draws from the synthetic catalogue and the run says so: a demo
 * that silently stopped finding anything would be indistinguishable from a
 * broken adapter.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const body = await request
      .json()
      .then((value: unknown) => requestSchema.parse(value ?? {}))
      .catch(() => ({}) as z.infer<typeof requestSchema>)

    return Response.json({ item: await runDiscovery(actor, body) })
  } catch (error) {
    return apiException(error)
  }
}
