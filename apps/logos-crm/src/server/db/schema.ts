import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const caseStatuses = [
  'new',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
] as const

export const casePriorities = ['low', 'medium', 'high'] as const

export const caseStatus = pgEnum('case_status', caseStatuses)
export const casePriority = pgEnum('case_priority', casePriorities)

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

export const schema = { cases }
