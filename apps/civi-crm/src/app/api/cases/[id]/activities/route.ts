import { listActivities } from '@/lib/civicrm/activities'
import { CiviCRMError } from '@/lib/civicrm/client'

// GET /api/cases/[id]/activities?page=
// Returns a paginated activity log for a case.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  try {
    return Response.json(await listActivities(id, page))
  } catch (err) {
    if (err instanceof CiviCRMError && err.status === 404)
      return Response.json({ error: `Case ${id} not found` }, { status: 404 })
    throw err
  }
}
