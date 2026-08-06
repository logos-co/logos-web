import {
  boolean,
  check,
  index,
  integer,
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
  casePriorities,
  caseStatuses,
  contactMethodTypes,
  directoryStatuses,
  taskPriorities,
  taskStatuses,
} from '@/contracts/values'

export {
  activityTypes,
  casePriorities,
  caseStatuses,
  contactMethodTypes,
  directoryStatuses,
  taskPriorities,
  taskStatuses,
} from '@/contracts/values'

export const caseStatus = pgEnum('case_status', caseStatuses)
export const casePriority = pgEnum('case_priority', casePriorities)

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
    sourceSystem: text('source_system'),
    externalId: text('external_id'),
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
    uniqueIndex('crm_organisations_external_uidx').on(
      table.sourceSystem,
      table.externalId
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
    sourceSystem: text('source_system'),
    externalId: text('external_id'),
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
    uniqueIndex('crm_people_external_uidx').on(
      table.sourceSystem,
      table.externalId
    ),
  ]
)

export const cases = pgTable(
  'crm_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    organisation: text('organisation').notNull(),
    owner: text('owner').notNull(),
    status: caseStatus('status').default('new').notNull(),
    stage: text('stage').notNull(),
    priority: casePriority('priority').default('medium').notNull(),
    nextAction: text('next_action').notNull(),
    nextActionAt: timestamp('next_action_at', { withTimezone: true }).notNull(),
    lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('crm_cases_status_idx').on(table.status),
    index('crm_cases_owner_idx').on(table.owner),
    index('crm_cases_updated_at_idx').on(table.updatedAt),
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
    createdBy: text('created_by').notNull(),
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
    assignee: text('assignee').notNull(),
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

export const schema = {
  activities,
  caseOrganisations,
  casePeople,
  cases,
  contactMethods,
  organisations,
  people,
  personOrganisationRelationships,
  tasks,
}
