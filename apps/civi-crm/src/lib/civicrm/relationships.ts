import { civiClient } from './client'
import { civiConfig } from './config'
import type { CiviCaseContact, CiviRelationship } from './types'

export async function getCoordinatorRelationship(
  caseId: string
): Promise<{ id: string; contactId: string } | null> {
  const rows = await civiClient.get<CiviRelationship>('Relationship', {
    select: ['id', 'contact_id_b'],
    where: [
      ['case_id', '=', Number(caseId)],
      [
        'relationship_type_id:name',
        '=',
        civiConfig.COORDINATOR_RELATIONSHIP_TYPE_NAME,
      ],
    ],
  })
  if (!rows[0]) return null
  return { id: String(rows[0].id), contactId: String(rows[0].contact_id_b) }
}

export async function deleteRelationship(id: string): Promise<void> {
  await civiClient.delete('Relationship', [['id', '=', Number(id)]])
}

export async function createCoordinatorRelationship(
  caseId: string,
  coordinatorContactId: string
): Promise<void> {
  const caseContacts = await civiClient.get<CiviCaseContact>('CaseContact', {
    select: ['contact_id'],
    where: [['case_id', '=', Number(caseId)]],
  })
  const leadContactId = caseContacts[0]?.contact_id
  if (!leadContactId)
    throw new Error(`No lead contact found for case ${caseId}`)

  await civiClient.create('Relationship', {
    case_id: Number(caseId),
    contact_id_a: leadContactId,
    contact_id_b: Number(coordinatorContactId),
    relationship_type_id: civiConfig.COORDINATOR_RELATIONSHIP_TYPE_ID,
  })
}
