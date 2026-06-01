'use client'

// TODO(phase-5): implement sortable/filterable case table with pagination

import type { CaseListItem } from '@/types/case'
import type { ViewConfig } from '@/lib/views'

type Props = {
  items: CaseListItem[]
  view: ViewConfig
  total: number
  page: number
}

export default function CasesTable(_props: Props) {
  return null
}
