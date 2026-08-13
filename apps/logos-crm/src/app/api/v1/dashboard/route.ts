import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import {
  countCasesByQueue,
  getDashboardSummary,
} from '@/server/case-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const [summary, queues] = await Promise.all([
      getDashboardSummary(),
      countCasesByQueue(actor.userId),
    ])
    return Response.json({ ...summary, queues })
  } catch (error) {
    return apiException(error)
  }
}
