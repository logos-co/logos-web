import { civiClient } from './client'
import { civiConfig } from './config'
import type { CiviRelationship } from './types'

// 2500 is a practical upper bound; coordinators are a small set relative to cases.
const COORDINATORS_FETCH_LIMIT = 2500

export async function listCoordinators(): Promise<
  { id: string; displayName: string }[]
> {
  const rows = await civiClient.get<CiviRelationship>('Relationship', {
    select: ['contact_id_b', 'contact_id_b.display_name'],
    where: [
      [
        'relationship_type_id:name',
        '=',
        civiConfig.COORDINATOR_RELATIONSHIP_TYPE_NAME,
      ],
      ['case_id', 'IS NOT NULL', null],
    ],
    limit: COORDINATORS_FETCH_LIMIT,
  })

  const seen = new Set<number>()
  const result: { id: string; displayName: string }[] = []
  for (const row of rows) {
    if (seen.has(row.contact_id_b)) continue
    seen.add(row.contact_id_b)
    result.push({
      id: String(row.contact_id_b),
      displayName: String(row['contact_id_b.display_name'] ?? ''),
    })
  }
  return result
}
