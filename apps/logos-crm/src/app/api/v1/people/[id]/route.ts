import { z } from 'zod/v4'

import { updatePersonSchema } from '@/contracts/directory'
import { apiError, apiException } from '@/server/api-response'
import { getPerson, updatePerson } from '@/server/directory-repository'

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
    const item = await getPerson(id)
    return item
      ? Response.json({ item })
      : apiError('NOT_FOUND', 'Person not found.', 404)
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
    const input = updatePersonSchema.parse(await request.json())
    const item = await updatePerson(id, input)
    return item
      ? Response.json({ item })
      : apiError('NOT_FOUND', 'Person not found.', 404)
  } catch (error) {
    return apiException(error)
  }
}
