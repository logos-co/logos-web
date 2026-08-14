import { reportQuerySchema } from '@/contracts/report'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { getFunnelReport } from '@/server/report-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    await resolveActor(request)
    const url = new URL(request.url)
    const query = reportQuerySchema.parse({
      cohortFrom: url.searchParams.get('cohort_from') ?? undefined,
      cohortTo: url.searchParams.get('cohort_to') ?? undefined,
      asOf: url.searchParams.get('as_of') ?? undefined,
      timezone: url.searchParams.get('timezone') ?? undefined,
      bucket: url.searchParams.get('bucket') || undefined,
    })
    return Response.json({ item: await getFunnelReport(query) })
  } catch (error) {
    return apiException(error)
  }
}
