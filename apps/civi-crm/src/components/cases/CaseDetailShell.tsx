'use client'

// TODO(phase-6): implement tabbed detail shell -- Case, Contact, Activity Log tabs

import type { CaseDetail, PaginatedResponse } from '@/types/case'
import type { CiviActivity } from '@/lib/civicrm/types'
import type { ViewConfig } from '@/lib/views'

type Props = {
  caseDetail: CaseDetail
  initialActivities: PaginatedResponse<CiviActivity>
  view: ViewConfig
}

export default function CaseDetailShell(_props: Props) {
  return null
}
