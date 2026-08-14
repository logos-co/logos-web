import { readFile } from 'node:fs/promises'

import { z } from 'zod/v4'

import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { readExportFile } from '@/server/export-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Serves the file through the app rather than from a public path.
 *
 * The contents are an extract of personal data, so reaching them has to go
 * through the same identity check as everything else; a static URL would be a
 * link anybody could forward.
 */
export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    await resolveActor(request)
    const { id } = await context.params
    z.string().uuid().parse(id)

    const { filePath, resource } = await readExportFile(id)
    const contents = await readFile(filePath, 'utf8')

    return new Response(contents, {
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
