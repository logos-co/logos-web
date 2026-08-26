import { apiException } from '@/server/api-response'
import { pipelineKeySchema } from '@/contracts/pipeline'
import { resolveActor } from '@/server/auth'
import {
  countCasesByQueue,
  getDashboardSummary,
} from '@/server/case-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    // Optional: the dashboard asks without it and gets the whole workspace,
    // the case board asks with it and gets numbers that match what it renders.
    const pipeline = pipelineKeySchema
      .optional()
      .parse(new URL(request.url).searchParams.get('pipeline') || undefined)
    const [summary, queues] = await Promise.all([
      getDashboardSummary(pipeline),
      countCasesByQueue(actor.userId, pipeline),
    ])
    return Response.json({ ...summary, queues })
  } catch (error) {
    return apiException(error)
  }
}
