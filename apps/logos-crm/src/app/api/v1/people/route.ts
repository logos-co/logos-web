import {
  createPersonSchema,
  directoryListQuerySchema,
} from '@/contracts/directory'
import { apiException } from '@/server/api-response'
import { createPerson, listPeople } from '@/server/directory-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const query = directoryListQuerySchema.parse({
      q: url.searchParams.get('q') || undefined,
    })
    return Response.json({ items: await listPeople(query) })
  } catch (error) {
    return apiException(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const input = createPersonSchema.parse(await request.json())
    return Response.json({ item: await createPerson(input) }, { status: 201 })
  } catch (error) {
    return apiException(error)
  }
}
