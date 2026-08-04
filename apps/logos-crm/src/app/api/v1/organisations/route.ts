import {
  createOrganisationSchema,
  directoryListQuerySchema,
} from '@/contracts/directory'
import { apiException } from '@/server/api-response'
import {
  createOrganisation,
  listOrganisations,
} from '@/server/directory-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const query = directoryListQuerySchema.parse({
      q: url.searchParams.get('q') || undefined,
    })
    return Response.json({ items: await listOrganisations(query) })
  } catch (error) {
    return apiException(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const input = createOrganisationSchema.parse(await request.json())
    return Response.json(
      { item: await createOrganisation(input) },
      { status: 201 }
    )
  } catch (error) {
    return apiException(error)
  }
}
