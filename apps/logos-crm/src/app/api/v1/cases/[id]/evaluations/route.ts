import { z } from 'zod/v4'

import { recordEvaluationSchema } from '@/contracts/evaluation'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import {
  getEvaluationSummary,
  recordEvaluation,
} from '@/server/evaluation-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    return Response.json({ item: await getEvaluationSummary(id) })
  } catch (error) {
    return apiException(error)
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    const actor = await resolveActor(request)
    const input = recordEvaluationSchema.parse(await request.json())
    return Response.json({ item: await recordEvaluation(actor, id, input) })
  } catch (error) {
    return apiException(error)
  }
}
