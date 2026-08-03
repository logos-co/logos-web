import { apiException } from '@/server/api-response'
import { getDashboardSummary } from '@/server/case-repository'

export async function GET(): Promise<Response> {
  try {
    return Response.json(await getDashboardSummary())
  } catch (error) {
    return apiException(error)
  }
}
