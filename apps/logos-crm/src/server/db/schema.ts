import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import {
  activityTypes,
  caseDecisions,
  casePriorities,
  caseStatuses,
  changeSources,
  contactMethodTypes,
  directoryStatuses,
  evaluationStages,
  notificationChannels,
  notificationStatuses,
  privacyRequestStatuses,
  privacyRequestTypes,
  scoutCertainties,
  scoutEntityTypes,
  scoutEvidenceFields,
  scoutExtractionMethods,
  scoutGates,
  scoutReviewDecisions,
  scoutReviewStates,
  taskPriorities,
  taskStatuses,
  userStatuses,
} from '@/contracts/values'

export {
  activityTypes,
  caseDecisions,
  casePriorities,
  caseStatuses,
  changeSources,
  contactMethodTypes,
  directoryStatuses,
  entityKinds,
  evaluationStages,
  externalSourceSystems,
  taskPriorities,
  taskStatuses,
  userStatuses,
} from '@/contracts/values'

export const caseStatus = pgEnum('case_status', caseStatuses)
export const casePriority = pgEnum('case_priority', casePriorities)
export const userStatus = pgEnum('user_status', userStatuses)
export const changeSource = pgEnum('change_source', changeSources)
export const evaluationStage = pgEnum('evaluation_stage', evaluationStages)
export const caseDecision = pgEnum('case_decision', caseDecisions)
export const notificationChannel = pgEnum(
  'notification_channel',
  notificationChannels
)
export const notificationStatus = pgEnum(
  'notification_status',
  notificationStatuses
)
export const privacyRequestType = pgEnum(
  'privacy_request_type',
  privacyRequestTypes
)
export const privacyRequestStatus = pgEnum(
  'privacy_request_status',
  privacyRequestStatuses
)
export const scoutEntityType = pgEnum('scout_entity_type', scoutEntityTypes)
export const scoutReviewState = pgEnum('scout_review_state', scoutReviewStates)
export const scoutReviewDecision = pgEnum(
  'scout_review_decision',
  scoutReviewDecisions
)
export const scoutEvidenceField = pgEnum(
  'scout_evidence_field',
  scoutEvidenceFields
)
export const scoutExtractionMethod = pgEnum(
  'scout_extraction_method',
  scoutExtractionMethods
)
export const scoutCertainty = pgEnum('scout_certainty', scoutCertainties)
export const scoutGate = pgEnum('scout_gate', scoutGates)

/**
 * Local CRM identities. `externalSubject` is the immutable subject supplied by
 * the Infra proxy once authentication is wired; it stays null while the app
 * runs in its no-auth mode. Email is a lookup key, never the identity key: an
 * address change must not create a second user.
 */
export const users = pgTable(
  'crm_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    externalSubject: text('external_subject'),
    email: text('email').notNull(),
    normalisedEmail: text('normalised_email').notNull(),
    displayName: text('display_name').notNull(),
    status: userStatus('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('crm_users_normalised_email_uidx').on(table.normalisedEmail),
    uniqueIndex('crm_users_external_subject_uidx').on(table.externalSubject),
    index('crm_users_status_idx').on(table.status),
  ]
)

export const teams = pgTable(
  'crm_teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    normalisedName: text('normalised_name').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('crm_teams_normalised_name_uidx').on(table.normalisedName),
  ]
)

export const userTeams = pgTable(
  'crm_user_teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('crm_user_teams_uidx').on(table.userId, table.teamId),
    index('crm_user_teams_team_idx').on(table.teamId),
  ]
)

export const directoryStatus = pgEnum('directory_status', directoryStatuses)
export const contactMethodType = pgEnum(
  'contact_method_type',
  contactMethodTypes
)

export const activityType = pgEnum('activity_type', activityTypes)
export const taskStatus = pgEnum('task_status', taskStatuses)
export const taskPriority = pgEnum('task_priority', taskPriorities)

export const organisations = pgTable(
  'crm_organisations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    displayName: text('display_name').notNull(),
    normalisedName: text('normalised_name').notNull(),
    domain: text('domain'),
    website: text('website'),
    status: directoryStatus('status').default('prospect').notNull(),
    summary: text('summary'),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('crm_organisations_normalised_name_uidx').on(
      table.normalisedName
    ),
    index('crm_organisations_status_idx').on(table.status),
    index('crm_organisations_domain_idx').on(table.domain),
  ]
)

export const people = pgTable(
  'crm_people',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fullName: text('full_name').notNull(),
    preferredName: text('preferred_name'),
    roleTitle: text('role_title'),
    status: directoryStatus('status').default('prospect').notNull(),
    summary: text('summary'),
    // Consent is a record of what the person agreed to, not a preference the
    // CRM may infer. Both default to false so an import or intake that omits
    // them can never be read as permission to contact.
    consentNewsletter: boolean('consent_newsletter').default(false).notNull(),
    consentEvents: boolean('consent_events').default(false).notNull(),
    consentRecordedAt: timestamp('consent_recorded_at', { withTimezone: true }),
    /**
     * Suppression. Consent says what someone agreed to; this says they asked to
     * be left alone, which overrides it. Kept as its own flag rather than by
     * clearing consent, so a withdrawal is visible as a decision instead of
     * looking like the consent was never given.
     */
    doNotContact: boolean('do_not_contact').default(false).notNull(),
    doNotContactAt: timestamp('do_not_contact_at', { withTimezone: true }),
    doNotContactReason: text('do_not_contact_reason'),
    /** Set when an erasure request has been applied to this record. */
    anonymisedAt: timestamp('anonymised_at', { withTimezone: true }),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('crm_people_full_name_idx').on(table.fullName),
    index('crm_people_status_idx').on(table.status),
  ]
)

/**
 * `ownerUserId` is nullable on purpose: unassigned is a real, reportable state
 * for freshly captured intake, not a data defect. `nextAction` is nullable for
 * the same reason - an untriaged case has no meaningful next action, and
 * forcing one produces placeholder text that diverges from the open task that
 * actually drives the work.
 *
 * `lastContactAt` is a cache maintained in the same transaction as contact-type
 * activities. It is never edited by hand: a stale-case view built on a manual
 * field silently reports notes as contact.
 */
export const cases = pgTable(
  'crm_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    teamId: uuid('team_id').references(() => teams.id, {
      onDelete: 'set null',
    }),
    status: caseStatus('status').default('new').notNull(),
    stage: text('stage').notNull(),
    priority: casePriority('priority').default('medium').notNull(),
    /** Answer to "How did you first hear about Logos?" on the intake form. */
    leadSource: text('lead_source'),
    /** Which funnel the applicant came through, e.g. Coalition Partner. */
    profile: text('profile'),
    summary: text('summary'),
    decision: caseDecision('decision').default('pending').notNull(),
    decisionReason: text('decision_reason'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decidedByUserId: uuid('decided_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    nextAction: text('next_action'),
    nextActionAt: timestamp('next_action_at', { withTimezone: true }),
    lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('crm_cases_status_idx').on(table.status),
    index('crm_cases_owner_idx').on(table.ownerUserId),
    index('crm_cases_team_idx').on(table.teamId),
    index('crm_cases_updated_at_idx').on(table.updatedAt),
    index('crm_cases_last_contact_idx').on(table.lastContactAt),
  ]
)

export const contactMethods = pgTable(
  'crm_contact_methods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    personId: uuid('person_id').references(() => people.id, {
      onDelete: 'cascade',
    }),
    organisationId: uuid('organisation_id').references(() => organisations.id, {
      onDelete: 'cascade',
    }),
    type: contactMethodType('type').notNull(),
    displayValue: text('display_value').notNull(),
    normalisedValue: text('normalised_value').notNull(),
    label: text('label'),
    isPreferred: boolean('is_preferred').default(false).notNull(),
    isSuppressed: boolean('is_suppressed').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'crm_contact_methods_one_owner_check',
      sql`num_nonnulls(${table.personId}, ${table.organisationId}) = 1`
    ),
    index('crm_contact_methods_person_idx').on(table.personId),
    index('crm_contact_methods_organisation_idx').on(table.organisationId),
    index('crm_contact_methods_normalised_value_idx').on(table.normalisedValue),
  ]
)

export const personOrganisationRelationships = pgTable(
  'crm_person_organisation_relationships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    personId: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    relationshipType: text('relationship_type').default('member').notNull(),
    title: text('title'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('crm_person_org_relationship_uidx').on(
      table.personId,
      table.organisationId,
      table.relationshipType
    ),
    index('crm_person_org_organisation_idx').on(table.organisationId),
  ]
)

export const casePeople = pgTable(
  'crm_case_people',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    personId: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    relationshipRole: text('relationship_role').default('contact').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('crm_case_people_uidx').on(table.caseId, table.personId),
    index('crm_case_people_person_idx').on(table.personId),
  ]
)

export const caseOrganisations = pgTable(
  'crm_case_organisations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    relationshipRole: text('relationship_role')
      .default('participant')
      .notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('crm_case_organisations_uidx').on(
      table.caseId,
      table.organisationId
    ),
    index('crm_case_organisations_org_idx').on(table.organisationId),
  ]
)

export const activities = pgTable(
  'crm_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id').references(() => cases.id, {
      onDelete: 'cascade',
    }),
    personId: uuid('person_id').references(() => people.id, {
      onDelete: 'cascade',
    }),
    organisationId: uuid('organisation_id').references(() => organisations.id, {
      onDelete: 'cascade',
    }),
    type: activityType('type').default('note').notNull(),
    body: text('body').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'crm_activities_one_subject_check',
      sql`num_nonnulls(${table.caseId}, ${table.personId}, ${table.organisationId}) = 1`
    ),
    index('crm_activities_case_idx').on(table.caseId, table.occurredAt),
    index('crm_activities_person_idx').on(table.personId, table.occurredAt),
    index('crm_activities_organisation_idx').on(
      table.organisationId,
      table.occurredAt
    ),
  ]
)

export const tasks = pgTable(
  'crm_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id').references(() => cases.id, {
      onDelete: 'cascade',
    }),
    personId: uuid('person_id').references(() => people.id, {
      onDelete: 'cascade',
    }),
    organisationId: uuid('organisation_id').references(() => organisations.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull(),
    description: text('description'),
    status: taskStatus('status').default('open').notNull(),
    priority: taskPriority('priority').default('medium').notNull(),
    assigneeUserId: uuid('assignee_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'crm_tasks_one_subject_check',
      sql`num_nonnulls(${table.caseId}, ${table.personId}, ${table.organisationId}) = 1`
    ),
    index('crm_tasks_case_idx').on(table.caseId, table.status, table.dueAt),
    index('crm_tasks_person_idx').on(table.personId, table.status, table.dueAt),
    index('crm_tasks_organisation_idx').on(
      table.organisationId,
      table.status,
      table.dueAt
    ),
  ]
)

/**
 * Temporal case ownership. The current owner is denormalised onto
 * `crm_cases.owner_user_id` for querying; this table answers "who owned this
 * case on a given date", which `updated_at` cannot. Exactly one open row
 * (`valid_to IS NULL`) per case is enforced by a partial unique index.
 */
export const caseAssignments = pgTable(
  'crm_case_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    ownerUserId: uuid('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    teamId: uuid('team_id').references(() => teams.id, {
      onDelete: 'set null',
    }),
    validFrom: timestamp('valid_from', { withTimezone: true })
      .defaultNow()
      .notNull(),
    validTo: timestamp('valid_to', { withTimezone: true }),
    assignedByUserId: uuid('assigned_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
    source: changeSource('source').default('app').notNull(),
  },
  (table) => [
    check(
      'crm_case_assignments_interval_check',
      sql`${table.validTo} IS NULL OR ${table.validTo} >= ${table.validFrom}`
    ),
    uniqueIndex('crm_case_assignments_open_uidx')
      .on(table.caseId)
      .where(sql`${table.validTo} IS NULL`),
    index('crm_case_assignments_case_idx').on(table.caseId, table.validFrom),
    index('crm_case_assignments_owner_idx').on(table.ownerUserId),
  ]
)

/**
 * Status and stage transitions. `effectiveAt` is when the change happened in
 * the business sense (an imported row carries the source timestamp);
 * `recordedAt` is when this database learned about it. Reporting uses
 * `effectiveAt`; `source = 'import'` rows are excluded from duration metrics
 * and counted as a coverage gap instead.
 */
export const caseWorkflowHistory = pgTable(
  'crm_case_workflow_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sequence: bigserial('sequence', { mode: 'number' }).notNull(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    fromStatus: caseStatus('from_status'),
    toStatus: caseStatus('to_status').notNull(),
    fromStage: text('from_stage'),
    toStage: text('to_stage'),
    effectiveAt: timestamp('effective_at', { withTimezone: true }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
    source: changeSource('source').default('app').notNull(),
  },
  (table) => [
    index('crm_case_workflow_history_case_idx').on(
      table.caseId,
      table.effectiveAt
    ),
    index('crm_case_workflow_history_to_status_idx').on(
      table.toStatus,
      table.effectiveAt
    ),
  ]
)

/**
 * Append-only mutation history. There is no update or delete path: corrections
 * are new events. `changes` holds a redacted before/after projection - never
 * note bodies, full contact details, or secrets.
 */
export const auditEvents = pgTable(
  'crm_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    requestId: text('request_id'),
    summary: text('summary'),
    changes: jsonb('changes'),
  },
  (table) => [
    index('crm_audit_events_entity_idx').on(
      table.entityType,
      table.entityId,
      table.occurredAt
    ),
    index('crm_audit_events_occurred_at_idx').on(table.occurredAt),
    index('crm_audit_events_actor_idx').on(table.actorUserId),
  ]
)

/**
 * Source-system identifiers, one row per (source, entity). A record can carry
 * several: the same person imported from the CiviCRM dump and matched again in
 * the Notion bridge period keeps both IDs, which is what makes the second
 * import idempotent rather than duplicating them.
 */
export const externalIdentities = pgTable(
  'crm_external_identities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceSystem: text('source_system').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    sourceId: text('source_id').notNull(),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    importRunId: uuid('import_run_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('crm_external_identities_source_uidx').on(
      table.sourceSystem,
      table.entityType,
      table.sourceId
    ),
    index('crm_external_identities_entity_idx').on(
      table.entityType,
      table.entityId
    ),
  ]
)

/**
 * Raw funnel submissions, written and committed before any mapping runs.
 *
 * Mapping a submission to people, organisations, and a case can fail on data
 * the form did not constrain. If that failure happened before anything was
 * stored, the applicant would simply be lost - the previous endpoint returned
 * 502 and hoped the visitor tried again. Storing the payload first makes the
 * mapping replayable, so a bad mapping is a bug to fix rather than an applicant
 * to apologise to.
 *
 * The payload contains personal data and is covered by the retention policy: it
 * is deleted once the derived records are confirmed, not kept indefinitely.
 */
export const intakeSubmissions = pgTable(
  'crm_intake_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Client-supplied idempotency key; a retry must not create a second case. */
    submissionId: text('submission_id').notNull(),
    formName: text('form_name').notNull(),
    payload: jsonb('payload').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    caseId: uuid('case_id').references(() => cases.id, {
      onDelete: 'set null',
    }),
    personId: uuid('person_id').references(() => people.id, {
      onDelete: 'set null',
    }),
    error: text('error'),
  },
  (table) => [
    uniqueIndex('crm_intake_submissions_submission_uidx').on(
      table.submissionId
    ),
    index('crm_intake_submissions_unprocessed_idx')
      .on(table.receivedAt)
      .where(sql`${table.processedAt} is null`),
  ]
)

/**
 * Structured intake evaluation, one row per case and stage.
 *
 * The CiviCRM scorecard died with that instance and the Notion template that
 * replaced it is free prose, which cannot be reported on, compared, or
 * attributed. These rows can: a score, the reviewer, and the rubric version
 * that produced it.
 *
 * One reviewer per stage in this version. Multiple reviewers and recorded
 * disagreement need quorum and re-review rules that nobody has agreed yet, and
 * inventing them here would be guessing at a process.
 */
export const caseEvaluations = pgTable(
  'crm_case_evaluations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    stage: evaluationStage('stage').notNull(),
    reviewerUserId: uuid('reviewer_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Null means "reviewed, no numeric judgement" - notes without a score. */
    score: integer('score'),
    notes: text('notes'),
    criteriaVersion: text('criteria_version').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'crm_case_evaluations_score_range_check',
      sql`${table.score} is null or (${table.score} between 1 and 5)`
    ),
    uniqueIndex('crm_case_evaluations_case_stage_uidx').on(
      table.caseId,
      table.stage
    ),
    index('crm_case_evaluations_reviewer_idx').on(table.reviewerUserId),
  ]
)

/**
 * Mentions resolved by the server from the note body.
 *
 * The client's autocomplete is a convenience, not the source of truth: a
 * request can claim any mention it likes, and a notification is an action taken
 * on someone's behalf. The unique constraint makes a re-parse idempotent.
 */
export const activityMentions = pgTable(
  'crm_activity_mentions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    mentionedUserId: uuid('mentioned_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('crm_activity_mentions_uidx').on(
      table.activityId,
      table.mentionedUserId
    ),
    index('crm_activity_mentions_user_idx').on(table.mentionedUserId),
  ]
)

/**
 * The business-level record of what was sent, kept because a completed Graphile
 * job is deleted from the queue. The queue answers "is there work left"; this
 * answers "was this person told, and when".
 *
 * `dedupeKey` is what stops a retry or a re-parse notifying someone twice.
 */
export const notificationDeliveries = pgTable(
  'crm_notification_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: notificationChannel('channel').notNull(),
    kind: text('kind').notNull(),
    activityId: uuid('activity_id').references(() => activities.id, {
      onDelete: 'cascade',
    }),
    caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
    dedupeKey: text('dedupe_key').notNull(),
    status: notificationStatus('status').default('pending').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    /** Status or error code only - never the note body or the address. */
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('crm_notification_deliveries_dedupe_uidx').on(table.dedupeKey),
    index('crm_notification_deliveries_status_idx').on(
      table.status,
      table.createdAt
    ),
    index('crm_notification_deliveries_user_idx').on(table.userId),
  ]
)

/**
 * One row per import execution, so "when did we last pull the bridge period"
 * has an answer that survives the terminal window it was run from.
 */
export const importRuns = pgTable(
  'crm_import_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceSystem: text('source_system').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: text('status').default('running').notNull(),
    createdCount: integer('created_count').default(0).notNull(),
    duplicateCount: integer('duplicate_count').default(0).notNull(),
    errorCount: integer('error_count').default(0).notNull(),
    /**
     * The newest source timestamp this run saw. The next run starts here rather
     * than re-reading everything.
     */
    watermark: timestamp('watermark', { withTimezone: true }),
  },
  (table) => [
    index('crm_import_runs_source_idx').on(table.sourceSystem, table.startedAt),
  ]
)

/**
 * Row-level failures, kept rather than logged. A run that reports "12 errors"
 * without saying which records failed cannot be acted on.
 */
export const importErrors = pgTable(
  'crm_import_errors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id')
      .notNull()
      .references(() => importRuns.id, { onDelete: 'cascade' }),
    sourceId: text('source_id').notNull(),
    /** Message only - never the source row, which is personal data. */
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('crm_import_errors_run_idx').on(table.runId)]
)

/**
 * Merge history. The duplicate is archived rather than deleted, and this row is
 * what explains why it went quiet - without it, a record that stopped being
 * used looks indistinguishable from one that was abandoned.
 */
export const entityMerges = pgTable(
  'crm_entity_merges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(),
    survivorId: uuid('survivor_id').notNull(),
    mergedId: uuid('merged_id').notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
    mergedAt: timestamp('merged_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('crm_entity_merges_merged_uidx').on(
      table.entityType,
      table.mergedId
    ),
    index('crm_entity_merges_survivor_idx').on(
      table.entityType,
      table.survivorId
    ),
  ]
)

/**
 * Requests a person made about their own data, tracked as work.
 *
 * The obligation is to answer within a deadline, so "received" has to be a
 * state somebody can see and count. Handling these in a mailbox means nobody
 * can show what was answered or when.
 */
export const privacyRequests = pgTable(
  'crm_privacy_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    personId: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    type: privacyRequestType('type').notNull(),
    status: privacyRequestStatus('status').default('received').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    handledByUserId: uuid('handled_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** What was asked and what was done - never a copy of the data itself. */
    notes: text('notes'),
  },
  (table) => [
    index('crm_privacy_requests_person_idx').on(table.personId),
    index('crm_privacy_requests_status_idx').on(table.status, table.receivedAt),
  ]
)

/**
 * Requested exports.
 *
 * The extract itself is produced when it is downloaded and never stored, so
 * there is no file path and no expiry here. What is kept is the request: who
 * asked for an extract of personal data, with which filters, and when.
 */
export const exportJobs = pgTable(
  'crm_export_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resource: text('resource').notNull(),
    /** Filters are stored so an export can be explained and reproduced. */
    filters: jsonb('filters').notNull(),
    requestedByUserId: uuid('requested_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    status: text('status').default('pending').notNull(),
    rowCount: integer('row_count'),
    error: text('error'),
    requestedAt: timestamp('requested_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('crm_export_jobs_status_idx').on(table.status, table.requestedAt),
    index('crm_export_jobs_requester_idx').on(table.requestedByUserId),
  ]
)

/**
 * Scout candidates.
 *
 * A candidate is not a CRM organisation and does not become one in this phase:
 * there is no foreign key to `crm_organisations` and no write path from Scout
 * into it. That absence is the boundary. `crm_organisations` is read by
 * `search-repository` and `directory-repository` with no status predicate at
 * all, so a status column could never have kept unaccepted candidates out of
 * the workspace - only a separate table with no link into it can.
 */
export const scoutCandidates = pgTable(
  'scout_candidates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: scoutEntityType('entity_type').notNull(),
    displayName: text('display_name').notNull(),
    normalisedName: text('normalised_name').notNull(),
    domain: text('domain'),
    summary: text('summary'),
    reviewState: scoutReviewState('review_state')
      .default('needs_review')
      .notNull(),
    /** Why the pipeline quarantined this candidate, when it did. */
    quarantineReason: text('quarantine_reason'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastObservedAt: timestamp('last_observed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'scout_candidates_quarantine_reason_check',
      sql`${table.reviewState} <> 'quarantined' or ${table.quarantineReason} is not null`
    ),
    uniqueIndex('scout_candidates_normalised_name_uidx').on(
      table.normalisedName
    ),
    index('scout_candidates_state_idx').on(
      table.reviewState,
      table.lastObservedAt
    ),
  ]
)

/**
 * Field-level evidence.
 *
 * `field` is an enum rather than free text, and the check constraints refuse
 * anything shaped like a personal contact detail. The plan says Scout records
 * organisations and not people; this is where that stops being a promise. A
 * contact field cannot be added by a careless insert, only by a migration.
 *
 * The excerpt is kept because a content hash proves a page changed and cannot
 * show what it said. Six months after a decision, "why did we accept this" has
 * to survive the source being rewritten.
 */
export const scoutEvidence = pgTable(
  'scout_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => scoutCandidates.id, { onDelete: 'cascade' }),
    field: scoutEvidenceField('field').notNull(),
    value: text('value').notNull(),
    sourceUrl: text('source_url').notNull(),
    sourceTitle: text('source_title'),
    contentHash: text('content_hash').notNull(),
    excerpt: text('excerpt').notNull(),
    extractionMethod: scoutExtractionMethod('extraction_method').notNull(),
    extractorVersion: text('extractor_version').notNull(),
    certainty: scoutCertainty('certainty').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    supersededAt: timestamp('superseded_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'scout_evidence_no_contact_value_check',
      sql`${table.value} !~* '(^|[[:space:]])[[:alnum:]._%+-]+@[[:alnum:].-]+\\.[[:alpha:]]{2,}' and ${table.value} !~ '\\+[0-9][0-9 ()-]{6,}' and ${table.value} !~ '[0-9]{9,}'`
    ),
    check(
      'scout_evidence_no_contact_excerpt_check',
      sql`${table.excerpt} !~* '(^|[[:space:]])[[:alnum:]._%+-]+@[[:alnum:].-]+\\.[[:alpha:]]{2,}'`
    ),
    index('scout_evidence_candidate_idx').on(table.candidateId, table.field),
    index('scout_evidence_expiry_idx').on(table.expiresAt),
  ]
)

/**
 * A calculated assessment. Immutable: a later calculation supersedes this row
 * rather than editing it, so the review below still points at what the
 * reviewer actually saw.
 *
 * There is no total. `dimensions` holds a band and its supporting evidence per
 * dimension, and `gate` says whether the evidence is good enough to assess at
 * all - a judgement about our data, kept out of the judgement about theirs.
 */
export const scoutAssessments = pgTable(
  'scout_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => scoutCandidates.id, { onDelete: 'cascade' }),
    rubricVersion: text('rubric_version').notNull(),
    gate: scoutGate('gate').notNull(),
    gateReason: text('gate_reason').notNull(),
    dimensions: jsonb('dimensions').notNull(),
    conflicts: jsonb('conflicts').notNull(),
    distinctSources: integer('distinct_sources').notNull(),
    calculatedAt: timestamp('calculated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    supersededAt: timestamp('superseded_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('scout_assessments_current_uidx')
      .on(table.candidateId)
      .where(sql`superseded_at is null`),
    index('scout_assessments_candidate_idx').on(
      table.candidateId,
      table.calculatedAt
    ),
  ]
)

/**
 * Append-only review decisions. The assessment is recorded alongside the
 * decision, because "we accepted this" is only meaningful with the evidence
 * that was on the screen at the time.
 */
export const scoutReviews = pgTable(
  'scout_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => scoutCandidates.id, { onDelete: 'cascade' }),
    assessmentId: uuid('assessment_id').references(() => scoutAssessments.id, {
      onDelete: 'set null',
    }),
    decision: scoutReviewDecision('decision').notNull(),
    reason: text('reason').notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    requestId: text('request_id'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('scout_reviews_candidate_idx').on(table.candidateId, table.reviewedAt),
  ]
)

/**
 * Discovery runs.
 *
 * `mode` is `synthetic` and nothing else exists yet: a run draws from a
 * built-in catalogue of invented organisations and makes no network call. The
 * row is kept anyway, because the question a reviewer asks about a queue is
 * "where did these come from and when", and a run nobody recorded cannot
 * answer it. When a real adapter arrives it becomes a second mode alongside
 * this one rather than a replacement for it.
 */
export const scoutDiscoveryRuns = pgTable(
  'scout_discovery_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mode: text('mode').notNull(),
    requestedByUserId: uuid('requested_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    requestId: text('request_id'),
    discoveredCount: integer('discovered_count').default(0).notNull(),
    quarantinedCount: integer('quarantined_count').default(0).notNull(),
    /** What the run did, in the words the reviewer reads. */
    note: text('note').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [index('scout_discovery_runs_started_idx').on(table.startedAt)]
)

export const schema = {
  scoutAssessments,
  scoutDiscoveryRuns,
  scoutCandidates,
  scoutEvidence,
  scoutReviews,
  activities,
  activityMentions,
  entityMerges,
  exportJobs,
  privacyRequests,
  importErrors,
  importRuns,
  caseEvaluations,
  intakeSubmissions,
  notificationDeliveries,
  auditEvents,
  caseAssignments,
  caseOrganisations,
  casePeople,
  caseWorkflowHistory,
  cases,
  contactMethods,
  externalIdentities,
  organisations,
  people,
  personOrganisationRelationships,
  tasks,
  teams,
  userTeams,
  users,
}
