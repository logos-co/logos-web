// GET  /api/cases/[id] — full case detail including contact data and other relationships
// PATCH /api/cases/[id] — update case and/or contact fields; fans out to CiviCRM entities
export async function GET() {
  return Response.json({ error: 'Not implemented' }, { status: 501 })
}

export async function PATCH() {
  return Response.json({ error: 'Not implemented' }, { status: 501 })
}
