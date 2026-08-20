import { scoutEventSchema } from '@/contracts/scout'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { recordScoutEvent } from '@/server/scout-repository'

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const input = scoutEventSchema.parse(await request.json())
    await recordScoutEvent(actor, input)
    return new Response(null, { status: 204 })
  } catch (error) {
    return apiException(error)
  }
}
