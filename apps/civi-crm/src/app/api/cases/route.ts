// GET /api/cases?page=&assignee=&status=&sort=&order=
// Returns a paginated list of Cases for the active view, merged with lead names and coordinators.
export async function GET() {
  return Response.json({ error: 'Not implemented' }, { status: 501 })
}
