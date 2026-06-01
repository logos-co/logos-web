export type CiviResponse<T> = { values: T[]; count: number }

export type CiviCase = {
  id: number
  subject: string
  status_id: number
  'status_id:label': string
  'status_id:name': string
  'case_type_id:name': string
  'Circle_Case.Lead_Source'?: string | null
  'Circle_Case.Lead_Source:label'?: string | null
  'Circle_Case.Lead_Source:name'?: string | null
  'Circle_Case.Profile'?: string | null
  'Circle_Case.Profile:label'?: string | null
  'Circle_Case.Profile:name'?: string | null
  'Circle_Case.Notes'?: string | null
  'Circle_Case.Mission_Values_Alignment'?: number | null
  'Circle_Case.Commitment_Reliability'?: number | null
  'Circle_Case.Facilitation_Distributed_Leadership'?: number | null
  'Circle_Case.Execution_Ability'?: number | null
  'Circle_Case.Relevant_Skills_Experience'?: number | null
  'Circle_Case.Overall_Fit'?: number | null
  'Circle_Case.Scorecard'?: number | null
  [key: string]: unknown
}

export type CiviCaseContact = {
  id: number
  case_id: number
  contact_id: number
  'contact_id.display_name': string
  'contact_id.email_primary': string
}

export type CiviRelationship = {
  id: number
  contact_id_a: number
  contact_id_b: number
  case_id: number | null
  'relationship_type_id:name': string
  'contact_id_b.display_name': string
}

export type CiviActivity = {
  id: number
  activity_type_id: number
  subject: string
  activity_date_time: string
  source_contact_id: number
  'source_contact_id.display_name': string
  case_id: number
  'status_id:label': string
}

export type CiviGroupContact = {
  id: number
  contact_id: number
  group_id: number
  'group_id.title': string
}

export type CiviContact = {
  id: number
  display_name: string
  email_primary: string
  first_name: string
  last_name: string
}

export type CiviEmail = {
  id: number
  contact_id: number
  email: string
  is_primary: boolean
}
