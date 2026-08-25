import type { CaseStatus } from '@/contracts/case'
import { statusLabels } from '@/contracts/case-labels'

export { statusLabels }

export const nextStatus: Record<CaseStatus, CaseStatus> = {
  new: 'in_progress',
  in_progress: 'waiting',
  waiting: 'resolved',
  resolved: 'closed',
  closed: 'closed',
}

export function StatusBadge({ value }: { value: CaseStatus }) {
  return (
    <span className={`status-badge status-${value}`}>
      <i /> {statusLabels[value]}
    </span>
  )
}
