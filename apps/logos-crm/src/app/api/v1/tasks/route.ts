import { createTaskSchema, workListQuerySchema } from '@/contracts/work'
import { apiException } from '@/server/api-response'
import { createTask, listTasks } from '@/server/work-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const query = workListQuerySchema.parse({
      subjectType: url.searchParams.get('subjectType'),
      subjectId: url.searchParams.get('subjectId'),
    })
    const items = await listTasks(query)
    return Response.json({ items })
  } catch (error) {
    return apiException(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const input = createTaskSchema.parse(await request.json())
    const item = await createTask(input)
    return Response.json({ item }, { status: 201 })
  } catch (error) {
    return apiException(error)
  }
}
