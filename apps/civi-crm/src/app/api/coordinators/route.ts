// GET /api/coordinators
// Returns a deduplicated list of all coordinators with an active case relationship.
// Used to populate the assignee filter dropdown on the list view.
export async function GET() {
  return Response.json({ error: 'Not implemented' }, { status: 501 })
}
