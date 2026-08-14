import { z } from 'zod/v4'

import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { buildExportCsv } from '@/server/export-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Produces and serves the extract.
 *
 * The contents are an extract of personal data, so reaching them goes through
 * the same identity check as everything else. Nothing is stored on the way:
 * the rows are read, encoded, and sent, which is why this works the same in a
 * deployment with a shared volume and one without.
 */
export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    await resolveActor(request)
    const { id } = await context.params
    z.string().uuid().parse(id)

    const { csv, resource } = await buildExportCsv(id)

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${resource}-${id}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return apiException(error)
  }
}
