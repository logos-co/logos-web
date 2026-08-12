import { caseListQuerySchema, createCaseSchema } from '@/contracts/case'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { createCase, listCases } from '@/server/case-repository'

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const query = caseListQuerySchema.parse({
      q: url.searchParams.get('q') || undefined,
      status: url.searchParams.get('status') || undefined,
    })
    const items = await listCases(query)
    return Response.json({ items })
  } catch (error) {
    return apiException(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const input = createCaseSchema.parse(await request.json())
    const item = await createCase(actor, input)
    return Response.json({ item }, { status: 201 })
  } catch (error) {
    return apiException(error)
  }
}
