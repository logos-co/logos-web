export const caseStatuses = [
  'new',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
] as const

export const casePriorities = ['low', 'medium', 'high'] as const
export const directoryStatuses = ['prospect', 'active', 'inactive'] as const
export const contactMethodTypes = [
  'email',
  'phone',
  'url',
  'messaging',
] as const
export const activityTypes = ['note', 'call', 'email', 'meeting'] as const
export const taskStatuses = ['open', 'completed', 'cancelled'] as const
export const taskPriorities = ['low', 'medium', 'high'] as const
