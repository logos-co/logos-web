/**
 * Identity modes. The policy each one carries - which are refused in
 * production, and what `demo` claims about the data - lives with the guard in
 * `src/server/env.ts`; the list is here because the API reports the mode and
 * the browser reads it.
 */
export const authModes = ['none', 'proxy', 'demo'] as const

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
 * Evaluation stages. These mirror the free-text sections of the Notion
 * evaluation template that intake review currently runs on, so the same
 * judgement is recorded in the same order - but as scored, attributable rows
 * rather than prose nobody can report on.
 */
export const evaluationStages = [
  'submission',
  'call',
  'one_pager',
  'other',
] as const

/**
 * `pending` is the state every case starts in and most cases sit in. It is
 * explicit rather than null so "not decided yet" is a value the queues and
 * reports can count.
 */
export const caseDecisions = [
  'pending',
  'approved',
  'redirected',
  'declined',
] as const

/** Lowest and highest score a reviewer may give a stage. */
export const EVALUATION_SCORE_MIN = 1
export const EVALUATION_SCORE_MAX = 5

/**
 * Which rubric produced a score. Stored on every evaluation so that changing
 * the criteria later does not silently rewrite the meaning of past scores.
 */
export const CURRENT_CRITERIA_VERSION = 'intake-v1'

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

/**
 * Delivery channels. Email only for now: the Discord bot's owner and channel
 * policy are undecided, so the adapter is absent rather than half-built.
 */
export const notificationChannels = ['email'] as const

export const notificationStatuses = [
  'pending',
  'sent',
  'failed',
  'skipped',
] as const

/**
 * The requests a person can make about their own data. Recorded as work with a
 * status rather than handled ad hoc, because the obligation is to answer within
 * a deadline and an untracked request is one nobody can prove was answered.
 */
export const privacyRequestTypes = [
  'access',
  'rectification',
  'erasure',
  'objection',
] as const

export const privacyRequestStatuses = [
  'received',
  'in_progress',
  'completed',
  'refused',
] as const

/**
 * How long the raw funnel payload is kept after its records exist. It is a copy
 * of personal data whose only remaining job is replaying a failed mapping, so
 * it expires once that stops being plausible.
 */
export const INTAKE_PAYLOAD_RETENTION_DAYS = 30

/**
 * Scout vocabularies.
 *
 * Scout discovers organisations and projects, not people. That boundary is a
 * vocabulary rather than a rule somebody has to remember: the evidence fields
 * below are the only things Scout can record, and none of them can hold a
 * person. Adding a field is a schema change, a migration, and a source-policy
 * review - which is the point.
 */
export const scoutEntityTypes = [
  'organisation',
  'project',
  'community',
  'unknown',
] as const

/**
 * `quarantined` is entered by the pipeline, never by a reviewer: it means the
 * subject looked like a natural person, so nothing was kept. `accepted` is
 * terminal for a candidate version, and in this phase it records a decision
 * rather than creating anything in the CRM.
 */
export const scoutReviewStates = [
  'needs_review',
  'accepted',
  'watch',
  'rejected',
  'needs_evidence',
  'quarantined',
] as const

export const scoutReviewDecisions = [
  'accept',
  'watch',
  'reject',
  'needs_evidence',
] as const

/**
 * What Scout may record about a candidate. Every field is a property of an
 * organisation or a published artefact. There is deliberately no field for a
 * name, an address, a handle, or a role: a contact field here would turn the
 * product into the contact database its plan says it is not.
 */
export const scoutEvidenceFields = [
  'official_site',
  'theme_match',
  'public_repository',
  'recent_release',
  'public_documentation',
  'contribution_path',
  'ecosystem_relation',
  'governance_model',
] as const

export const scoutExtractionMethods = [
  'deterministic',
  'manual',
  'ai_assisted',
  'synthetic',
] as const

/**
 * How exact the recorded value is, replacing a numeric confidence. A number
 * between zero and one reads as a probability, and nothing here is calibrated
 * against anything, so the scale would be a claim the product cannot support.
 */
export const scoutCertainties = ['exact', 'derived', 'ambiguous'] as const

/**
 * Bands rather than points. A weighted total invites the reader to treat it as
 * a partnership decision, and to compare two candidates whose evidence has
 * nothing in common.
 */
export const scoutBands = ['strong', 'moderate', 'weak', 'unevidenced'] as const

export const scoutDimensions = [
  'technical_relevance',
  'current_activity',
  'open_collaboration',
  'ecosystem_adjacency',
] as const

/**
 * Evidence quality is a gate, not a dimension. Adding it to a total lets a
 * well-documented irrelevant organisation outrank a sparsely documented
 * perfect one, which is the opposite of what a review queue is for.
 */
export const scoutGates = ['sufficient', 'insufficient', 'conflicted'] as const

export const CURRENT_SCOUT_RUBRIC_VERSION = 'scout-fit-v1'

/** Distinct unexpired sources a candidate needs before it can be assessed. */
export const SCOUT_MIN_DISTINCT_SOURCES = 2
