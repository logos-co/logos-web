import { searchQuerySchema } from '@/contracts/search'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { search } from '@/server/search-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    await resolveActor(request)
    const url = new URL(request.url)
    const { q } = searchQuerySchema.parse({
      q: url.searchParams.get('q') ?? '',
    })
    return Response.json({ item: await search(q) })
  } catch (error) {
    return apiException(error)
  }
}
