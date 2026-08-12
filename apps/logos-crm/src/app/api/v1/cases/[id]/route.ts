import { z } from 'zod/v4'

import { updateCaseStatusSchema } from '@/contracts/case'
import { apiError, apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { getCase, updateCaseStatus } from '@/server/case-repository'

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
    const item = await getCase(id)
    return item
      ? Response.json({ item })
      : apiError('NOT_FOUND', 'Case not found.', 404)
  } catch (error) {
    return apiException(error)
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    const actor = await resolveActor(request)
    const input = updateCaseStatusSchema.parse(await request.json())
    const item = await updateCaseStatus(actor, id, input)

    return Response.json({ item })
  } catch (error) {
    return apiException(error)
  }
}
