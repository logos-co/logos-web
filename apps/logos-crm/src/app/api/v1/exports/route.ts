import { createExportSchema } from '@/contracts/export'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { requestExport } from '@/server/export-repository'

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const input = createExportSchema.parse(await request.json())
    return Response.json(
      { item: await requestExport(actor, input) },
      {
        status: 202,
      }
    )
  } catch (error) {
    return apiException(error)
  }
}
