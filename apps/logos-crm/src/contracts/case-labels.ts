import type { CaseStatus } from './case'

/**
 * How a status is named on screen. In the contract rather than the badge
 * component because the timeline is built server-side and has to name a status
 * the same way the badge does - two spellings of the same state is how a
 * screen and an export start disagreeing.
 */
export const statusLabels: Record<CaseStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
}
