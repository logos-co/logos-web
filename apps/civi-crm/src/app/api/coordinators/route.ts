import { cacheLife, cacheTag } from 'next/cache'
import { connection } from 'next/server'
import { listCoordinators } from '@/lib/civicrm/coordinators'

async function listCoordinatorsCached() {
  'use cache'
  cacheTag('coordinators')
  cacheLife('hours')
  return listCoordinators()
}

// GET /api/coordinators
// Returns a deduplicated list of all coordinators with an active case relationship.
// Used to populate the assignee filter dropdown on the list view.
export async function GET() {
  await connection()
  return Response.json(await listCoordinatorsCached())
}
