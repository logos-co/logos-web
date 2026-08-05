import type { CaseStatus } from '@/contracts/case'

export const statusLabels: Record<CaseStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
}

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
