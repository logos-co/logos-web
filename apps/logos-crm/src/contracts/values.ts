export const caseStatuses = [
  'new',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
] as const

export const casePriorities = ['low', 'medium', 'high'] as const

/**
 * Allowed case status transitions. The service layer is the enforcement point:
 * every accepted transition writes workflow history and an audit event in the
 * same transaction, so an unlisted transition must fail before either is
 * written. `closed` is terminal; reopening a closed case is a separate,
 * explicitly audited action rather than a status edit.
 */
export const caseStatusTransitions = {
  new: ['in_progress', 'closed'],
  in_progress: ['waiting', 'resolved', 'closed'],
  waiting: ['in_progress', 'resolved', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: [],
} as const satisfies Record<
  (typeof caseStatuses)[number],
  ReadonlyArray<(typeof caseStatuses)[number]>
>

export const userStatuses = ['pending', 'active', 'suspended'] as const

/**
 * Where a recorded change came from. `import` rows carry a source system in
 * `crm_external_identities` and are excluded from transition-duration metrics,
 * because an imported timestamp reflects the export, not the decision.
 */
export const changeSources = ['app', 'import', 'system'] as const

/** Source systems that can own an external identity. */
export const externalSourceSystems = [
  'civicrm',
  'notion',
  'funnel',
  'demo',
] as const

/** Entity kinds that can carry an external identity or an audit event. */
export const entityKinds = ['person', 'organisation', 'case'] as const
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
