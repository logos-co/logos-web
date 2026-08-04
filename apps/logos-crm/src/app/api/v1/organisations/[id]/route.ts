import { z } from 'zod/v4'

import { updateOrganisationSchema } from '@/contracts/directory'
import { apiError, apiException } from '@/server/api-response'
import {
  getOrganisation,
  updateOrganisation,
} from '@/server/directory-repository'

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
    const item = await getOrganisation(id)
    return item
      ? Response.json({ item })
      : apiError('NOT_FOUND', 'Organisation not found.', 404)
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
    const input = updateOrganisationSchema.parse(await request.json())
    const item = await updateOrganisation(id, input)
    return item
      ? Response.json({ item })
      : apiError('NOT_FOUND', 'Organisation not found.', 404)
  } catch (error) {
    return apiException(error)
  }
}
