import { z } from 'zod/v4'

import { updateTaskSchema } from '@/contracts/work'
import { apiError, apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { updateTask } from '@/server/work-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params
    z.string().uuid().parse(id)
    const actor = await resolveActor(request)
    const input = updateTaskSchema.parse(await request.json())
    const item = await updateTask(actor, id, input)

    return item
      ? Response.json({ item })
      : apiError('NOT_FOUND', 'Task not found.', 404)
  } catch (error) {
    return apiException(error)
  }
}
