import { createActivitySchema, workListQuerySchema } from '@/contracts/work'
import { apiException } from '@/server/api-response'
import { createActivity, listActivities } from '@/server/work-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const query = workListQuerySchema.parse({
      subjectType: url.searchParams.get('subjectType'),
      subjectId: url.searchParams.get('subjectId'),
    })
    const items = await listActivities(query)
    return Response.json({ items })
  } catch (error) {
    return apiException(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const input = createActivitySchema.parse(await request.json())
    const item = await createActivity(input)
    return Response.json({ item }, { status: 201 })
  } catch (error) {
    return apiException(error)
  }
}
