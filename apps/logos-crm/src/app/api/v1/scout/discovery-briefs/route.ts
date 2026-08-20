import { createScoutDiscoveryBriefSchema } from '@/contracts/scout'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import {
  createScoutDiscoveryBrief,
  listScoutDiscoveryBriefs,
} from '@/server/scout-brief-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    await resolveActor(request)
    return Response.json({ items: await listScoutDiscoveryBriefs() })
  } catch (error) {
    return apiException(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const input = createScoutDiscoveryBriefSchema.parse(await request.json())
    return Response.json({
      item: await createScoutDiscoveryBrief(actor, input),
    })
  } catch (error) {
    return apiException(error)
  }
}
