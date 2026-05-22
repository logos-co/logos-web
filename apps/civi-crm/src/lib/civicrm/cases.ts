import { civiClient } from './client'
import { civiConfig } from './config'
import type { CiviWhere } from './client'
import type {
  CiviCase,
  CiviCaseContact,
  CiviGroupContact,
  CiviRelationship,
} from './types'
import type { ViewConfig, FieldDef } from '@/lib/views'
import type { CaseListItem, CaseDetail, PaginatedResponse } from '@/types/case'
import { PAGE_SIZE } from '@/constants/pagination'
import { CiviCRMError } from './client'

export type ListCasesFilters = {
  status?: string
  assigneeContactId?: string
  sort?: string
  order?: 'asc' | 'desc'
}

const SORT_FIELD_MAP: Record<string, string> = {
  subject: 'subject',
  status: 'status_id:name',
  leadSource: 'Circle_Case.Lead_Source:name',
  profile: 'Circle_Case.Profile:name',
  scorecard: 'Circle_Case.Scorecard',
}

export function buildCaseSelect(view: ViewConfig): string[] {
  const paths = new Set<string>(['id'])
  for (const field of view.fields) {
    if (field.skipSelect) continue
    if (field.updateTarget.entity !== 'Case') continue
    paths.add(field.civiPath)
    if (field.civiLabelPath) paths.add(field.civiLabelPath)
    if (field.civiNamePath) paths.add(field.civiNamePath)
  }
  return [...paths]
}

function buildContactSelect(view: ViewConfig): string[] {
  const paths = new Set<string>([
    'case_id',
    'contact_id',
    'contact_id.display_name',
  ])
  for (const field of view.fields) {
    if (field.skipSelect) continue
    if (
      field.updateTarget.entity === 'Case' ||
      field.updateTarget.entity === 'Relationship'
    )
      continue
    // Contact and Email fields are fetched via CaseContact deep joins
    paths.add(field.civiPath)
    if (field.civiLabelPath) paths.add(field.civiLabelPath)
    if (field.civiNamePath) paths.add(field.civiNamePath)
  }
  return [...paths]
}

export async function listCases(
  view: ViewConfig,
  filters: ListCasesFilters,
  page: number
): Promise<PaginatedResponse<CaseListItem>> {
  const offset = (page - 1) * PAGE_SIZE

  // Pre-step: resolve case IDs for assignee filter
  let caseIdsForAssignee: number[] | undefined
  if (filters.assigneeContactId) {
    const assigneeRels = await civiClient.get<CiviRelationship>(
      'Relationship',
      {
        select: ['case_id'],
        where: [
          ['contact_id_b', '=', Number(filters.assigneeContactId)],
          [
            'relationship_type_id:name',
            '=',
            civiConfig.COORDINATOR_RELATIONSHIP_TYPE_NAME,
          ],
        ],
      }
    )
    caseIdsForAssignee = assigneeRels.map((r) => r.case_id)
    if (caseIdsForAssignee.length === 0) {
      return { items: [], total: 0, page, pageSize: PAGE_SIZE }
    }
  }

  // Build WHERE for Case query
  const caseWhere: CiviWhere[] = [['case_type_id:name', '=', view.caseTypeName]]
  if (filters.status) caseWhere.push(['status_id:name', '=', filters.status])
  if (caseIdsForAssignee) caseWhere.push(['id', 'IN', caseIdsForAssignee])

  // Build orderBy
  const sortPath = filters.sort
    ? (SORT_FIELD_MAP[filters.sort] ?? 'subject')
    : 'subject'
  const sortDir = filters.order === 'desc' ? 'DESC' : 'ASC'

  // Round 1: paginated Case rows + total count in parallel
  const [caseRows, total] = await Promise.all([
    civiClient.get<CiviCase>('Case', {
      select: buildCaseSelect(view),
      where: caseWhere,
      orderBy: [[sortPath, sortDir]],
      limit: PAGE_SIZE,
      offset,
    }),
    civiClient.count('Case', { where: caseWhere }),
  ])

  if (caseRows.length === 0) {
    return { items: [], total, page, pageSize: PAGE_SIZE }
  }

  const caseIds = caseRows.map((c) => c.id)

  // Round 2: lead contacts + coordinator relationships in parallel
  const [caseContacts, coordinatorRels] = await Promise.all([
    civiClient.get<CiviCaseContact>('CaseContact', {
      select: ['case_id', 'contact_id', 'contact_id.display_name'],
      where: [['case_id', 'IN', caseIds]],
    }),
    civiClient.get<CiviRelationship>('Relationship', {
      select: ['case_id', 'contact_id_b.display_name'],
      where: [
        ['case_id', 'IN', caseIds],
        [
          'relationship_type_id:name',
          '=',
          civiConfig.COORDINATOR_RELATIONSHIP_TYPE_NAME,
        ],
      ],
    }),
  ])

  // Build lookup maps
  const leadContactByCaseId = new Map<number, CiviCaseContact>()
  for (const cc of caseContacts) {
    if (!leadContactByCaseId.has(cc.case_id))
      leadContactByCaseId.set(cc.case_id, cc)
  }
  const coordinatorByCaseId = new Map<number, string>()
  for (const rel of coordinatorRels) {
    coordinatorByCaseId.set(
      rel.case_id,
      String(rel['contact_id_b.display_name'] ?? '')
    )
  }

  const items: CaseListItem[] = caseRows.map((c) => ({
    id: String(c.id),
    subject: c.subject,
    status: {
      value: String(c['status_id:name'] ?? ''),
      label: String(c['status_id:label'] ?? ''),
    },
    leadSource: (c['Circle_Case.Lead_Source:label'] as string | null) ?? null,
    scorecard: (c['Circle_Case.Scorecard'] as number | null) ?? null,
    assignedTo: coordinatorByCaseId.get(c.id) ?? null,
    leadContactName:
      leadContactByCaseId.get(c.id)?.['contact_id.display_name'] ?? '',
  }))

  return { items, total, page, pageSize: PAGE_SIZE }
}

export async function getCaseById(
  caseId: string,
  view: ViewConfig
): Promise<CaseDetail> {
  // Round 1: Case + CaseContact (with deep joins for contact fields) + coordinator Relationship
  const [caseRows, caseContacts, coordinatorRels] = await Promise.all([
    civiClient.get<CiviCase>('Case', {
      select: buildCaseSelect(view),
      where: [['id', '=', Number(caseId)]],
    }),
    civiClient.get<Record<string, unknown>>('CaseContact', {
      select: buildContactSelect(view),
      where: [['case_id', '=', Number(caseId)]],
    }),
    civiClient.get<CiviRelationship>('Relationship', {
      select: ['id', 'contact_id_b', 'contact_id_b.display_name'],
      where: [
        ['case_id', '=', Number(caseId)],
        [
          'relationship_type_id:name',
          '=',
          civiConfig.COORDINATOR_RELATIONSHIP_TYPE_NAME,
        ],
      ],
    }),
  ])

  if (!caseRows[0]) throw new CiviCRMError(404, `Case ${caseId} not found`)
  const caseRow = caseRows[0]
  const leadContact = caseContacts[0]
  if (!leadContact) throw new CiviCRMError(404, `No contact for case ${caseId}`)
  const contactId = String(leadContact.contact_id)
  const coordinatorRel = coordinatorRels[0] ?? null

  // Round 2: other cases for this contact + group memberships
  const [otherCaseContacts, groupContacts] = await Promise.all([
    civiClient.get<{ case_id: number; 'case_id.subject': string }>(
      'CaseContact',
      {
        select: ['case_id', 'case_id.subject'],
        where: [
          ['contact_id', '=', Number(contactId)],
          ['case_id', '!=', Number(caseId)],
        ],
      }
    ),
    civiClient.get<CiviGroupContact>('GroupContact', {
      select: ['group_id', 'group_id.title'],
      where: [
        ['contact_id', '=', Number(contactId)],
        ['status', '=', 'Added'],
      ],
    }),
  ])

  // Populate fieldValues from view field definitions
  const fieldValues: Record<string, unknown> = {}
  for (const field of view.fields) {
    if (field.skipSelect) continue
    if (field.updateTarget.entity === 'Case') {
      const displayPath = field.civiLabelPath ?? field.civiPath
      fieldValues[field.key] = caseRow[displayPath] ?? caseRow[field.civiPath]
    } else if (
      field.updateTarget.entity === 'Contact' ||
      field.updateTarget.entity === 'Email'
    ) {
      const displayPath = field.civiLabelPath ?? field.civiPath
      fieldValues[field.key] =
        leadContact?.[displayPath] ?? leadContact?.[field.civiPath]
    }
  }

  // Inject coordinator name for the skipSelect assignedTo field
  const coordinatorField = view.fields.find(
    (f: FieldDef) => f.skipSelect && f.updateTarget.entity === 'Relationship'
  )
  if (coordinatorField) {
    fieldValues[coordinatorField.key] = coordinatorRel
      ? String(coordinatorRel['contact_id_b.display_name'] ?? '')
      : null
  }

  return {
    id: caseId,
    subject: String(caseRow.subject),
    contactId,
    fieldValues,
    otherCases: otherCaseContacts.map((cc) => ({
      id: String(cc.case_id),
      subject: cc['case_id.subject'],
    })),
    groupMemberships: groupContacts.map((gc) => ({
      id: String(gc.group_id),
      label: gc['group_id.title'],
    })),
    coordinatorRelationshipId: coordinatorRel
      ? String(coordinatorRel.id)
      : null,
  }
}

export async function updateCase(
  caseId: string,
  civiValues: Record<string, unknown>
): Promise<void> {
  const safeValues = { ...civiValues }
  // Circle_Case.Scorecard is computed from sub-fields and is read-only in the API.
  delete safeValues['Circle_Case.Scorecard']
  await civiClient.update('Case', [['id', '=', Number(caseId)]], safeValues)
}
