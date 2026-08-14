import { sql } from 'drizzle-orm'

import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import { organisations, users } from '@/server/db/schema'

/**
 * Integration tests run against a real PostgreSQL instance with the checked-in
 * migrations applied. A mocked database would not exercise the constraints,
 * partial indexes, and transaction boundaries that this milestone is about.
 *
 * Start one with:
 *   docker compose -f apps/logos-crm/compose.yaml up -d crm-db
 *   TEST_DATABASE_URL=postgresql://logos:logos@localhost:5434/logos_crm \
 *     pnpm --filter logos-crm db:migrate
 */
export const isIntegrationEnabled = Boolean(process.env.TEST_DATABASE_URL)

const TABLES = [
  'scout_discovery_runs',
  'scout_reviews',
  'scout_assessments',
  'scout_evidence',
  'scout_candidates',
  'crm_export_jobs',
  'crm_privacy_requests',
  'crm_entity_merges',
  'crm_import_errors',
  'crm_import_runs',
  'crm_notification_deliveries',
  'crm_activity_mentions',
  'crm_case_evaluations',
  'crm_intake_submissions',
  'crm_audit_events',
  'crm_case_workflow_history',
  'crm_case_assignments',
  'crm_activities',
  'crm_tasks',
  'crm_case_people',
  'crm_case_organisations',
  'crm_cases',
  'crm_contact_methods',
  'crm_person_organisation_relationships',
  'crm_external_identities',
  'crm_people',
  'crm_organisations',
  'crm_user_teams',
  'crm_teams',
  'crm_users',
] as const

export async function resetDatabase(): Promise<void> {
  await db.execute(
    sql.raw(`truncate table ${TABLES.join(', ')} restart identity cascade`)
  )
}

export async function createTestUser(
  displayName: string,
  email: string
): Promise<ActorContext> {
  const [user] = await db
    .insert(users)
    .values({
      displayName,
      email,
      normalisedEmail: email.toLocaleLowerCase('en'),
      status: 'active',
    })
    .returning()

  if (!user) throw new Error('The test user was not created.')

  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    requestId: `test-${user.id}`,
  }
}

export async function createTestOrganisation(
  displayName: string
): Promise<string> {
  const [organisation] = await db
    .insert(organisations)
    .values({
      displayName,
      normalisedName: displayName.toLocaleLowerCase('en'),
    })
    .returning()

  if (!organisation) throw new Error('The test organisation was not created.')
  return organisation.id
}
