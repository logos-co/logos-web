import { z } from 'zod/v4'

import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { getExport } from '@/server/export-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    await resolveActor(request)
    const { id } = await context.params
    z.string().uuid().parse(id)
    return Response.json({ item: await getExport(id) })
  } catch (error) {
    return apiException(error)
  }
}
