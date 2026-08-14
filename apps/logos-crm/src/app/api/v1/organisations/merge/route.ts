import { mergeRequestSchema } from '@/contracts/merge'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { mergeOrganisations } from '@/server/merge-repository'

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const input = mergeRequestSchema.parse(await request.json())
    await mergeOrganisations(actor, input)
    return Response.json({ item: { survivorId: input.survivorId } })
  } catch (error) {
    return apiException(error)
  }
}
