export type CaseListItem = {
  id: string
  subject: string
  status: { value: string; label: string }
  leadSource: string | null
  scorecard: number | null
  assignedTo: string | null
  leadContactName: string
}

export type CaseDetail = {
  id: string
  subject: string
  contactId: string
  fieldValues: Record<string, unknown>
  otherCases: { id: string; subject: string }[]
  groupMemberships: { id: string; label: string }[]
  coordinatorRelationshipId: string | null
}

export type CasePatchPayload = Record<string, unknown>

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
