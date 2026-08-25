import { timelineQuerySchema } from '@/contracts/timeline'
import { apiException } from '@/server/api-response'
import { listTimeline } from '@/server/timeline-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const query = timelineQuerySchema.parse({
      subjectType: url.searchParams.get('subjectType') || undefined,
      subjectId: url.searchParams.get('subjectId') || undefined,
    })
    return Response.json({ items: await listTimeline(query) })
  } catch (error) {
    return apiException(error)
  }
}
