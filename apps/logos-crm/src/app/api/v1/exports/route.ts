import { createExportSchema } from '@/contracts/export'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { requestExport } from '@/server/export-repository'

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const input = createExportSchema.parse(await request.json())
    // 201 rather than 202: the request row exists when this returns, and
    // there is no longer a queued job for the caller to wait on.
    return Response.json({ item: await requestExport(actor, input) }, { status: 201 })
  } catch (error) {
    return apiException(error)
  }
}
