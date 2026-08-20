import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { getScoutReport } from '@/server/scout-report-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    await resolveActor(request)
    return Response.json({ item: await getScoutReport() })
  } catch (error) {
    return apiException(error)
  }
}
