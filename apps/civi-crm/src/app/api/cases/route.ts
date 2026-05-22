import { cacheLife, cacheTag } from 'next/cache'
import { listCases, type ListCasesFilters } from '@/lib/civicrm/cases'
import { getActiveView } from '@/lib/views'

async function listCasesCached(filters: ListCasesFilters, page: number) {
  'use cache'
  cacheTag('cases')
  cacheLife('minutes')
  const view = getActiveView()
  return listCases(view, filters, page)
}

// GET /api/cases?page=&assignee=&status=&sort=&order=
// Returns a paginated list of Cases for the active view, merged with lead names and coordinators.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  const filters: ListCasesFilters = {
    assigneeContactId: url.searchParams.get('assignee') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    sort: url.searchParams.get('sort') ?? 'subject',
    order: url.searchParams.get('order') === 'desc' ? 'desc' : 'asc',
  }
  return Response.json(await listCasesCached(filters, page))
}
