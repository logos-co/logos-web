import { and, eq, ne, sql } from 'drizzle-orm'

import type { DuplicateSuggestion, MergeRequest } from '@/contracts/merge'
import { recordAuditEvent } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import { entityMerges, organisations, people } from '@/server/db/schema'
import { invalidTransition, notFound } from '@/server/service-errors'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** How many suggestions to show; this is a review queue, not a report. */
const SUGGESTION_LIMIT = 10

/**
 * Moves the rows in `table` that point at the duplicate over to the survivor.
 *
 * Link tables carry uniqueness constraints - a case cannot list the same person
 * twice - so rows that would collide are dropped rather than moved. Moving them
 * blindly would abort the merge on a constraint violation, which is the one
 * outcome worse than a duplicate: a half-merged record.
 */
async function moveLinks(
  transaction: Transaction,
  table: string,
  column: string,
  survivorId: string,
  duplicateId: string,
  conflictColumns: string[]
): Promise<void> {
  // Table and column names are constants from this file; the ids are values and
  // stay parameterised. Interpolating them would be safe only for as long as
  // every caller keeps validating them, which is not a property worth relying
  // on.
  const relation = sql.raw(table)
  const key = sql.raw(column)

  if (conflictColumns.length > 0) {
    const matches = sql.raw(
      conflictColumns
        .map((name) => `existing.${name} = moving.${name}`)
        .join(' and ')
    )

    await transaction.execute(sql`
      delete from ${relation} as moving
      where moving.${key} = ${duplicateId}
        and exists (
          select 1 from ${relation} as existing
          where existing.${key} = ${survivorId} and ${matches}
        )
    `)
  }

  await transaction.execute(sql`
    update ${relation} set ${key} = ${survivorId} where ${key} = ${duplicateId}
  `)
}

export async function findDuplicatePeople(
  personId: string
): Promise<DuplicateSuggestion[]> {
  const rows = await db.execute<{
    id: string
    title: string
    subtitle: string | null
    reason: string
  }>(sql`
    with subject as (
      select p.id, p.full_name,
             lower(trim(p.full_name)) as normalised_name,
             (select cm.normalised_value
              from crm_contact_methods cm
              where cm.person_id = p.id and cm.type = 'email'
              order by cm.is_preferred desc limit 1) as email
      from crm_people p where p.id = ${personId}
    )
    select candidate.id,
           candidate.full_name as title,
           candidate.role_title as subtitle,
           case
             when subject.email is not null and exists (
               select 1 from crm_contact_methods cm
               where cm.person_id = candidate.id
                 and cm.type = 'email'
                 and cm.normalised_value = subject.email
             ) then 'same_email'
             else 'same_name'
           end as reason
    from crm_people candidate, subject
    where candidate.id <> subject.id
      and candidate.status <> 'inactive'
      and (
        lower(trim(candidate.full_name)) = subject.normalised_name
        or (subject.email is not null and exists (
          select 1 from crm_contact_methods cm
          where cm.person_id = candidate.id
            and cm.type = 'email'
            and cm.normalised_value = subject.email
        ))
      )
      -- A record already merged away is not a suggestion; it is history.
      and not exists (
        select 1 from crm_entity_merges m
        where m.entity_type = 'person' and m.merged_id = candidate.id
      )
    limit ${SUGGESTION_LIMIT}
  `)

  return rows.rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    reason: row.reason as DuplicateSuggestion['reason'],
  }))
}

export async function findDuplicateOrganisations(
  organisationId: string
): Promise<DuplicateSuggestion[]> {
  const [subject] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, organisationId))
    .limit(1)

  if (!subject) return []

  const rows = await db
    .select({
      id: organisations.id,
      title: organisations.displayName,
      subtitle: organisations.domain,
    })
    .from(organisations)
    .where(
      and(
        ne(organisations.id, organisationId),
        ne(organisations.status, 'inactive'),
        subject.domain
          ? sql`(${organisations.normalisedName} = ${subject.normalisedName} or ${organisations.domain} = ${subject.domain})`
          : eq(organisations.normalisedName, subject.normalisedName),
        sql`not exists (
          select 1 from ${entityMerges} m
          where m.entity_type = 'organisation' and m.merged_id = ${organisations.id}
        )`
      )
    )
    .limit(SUGGESTION_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    reason:
      subject.domain && row.subtitle === subject.domain
        ? ('same_domain' as const)
        : ('same_name' as const),
  }))
}

/**
 * Merges one person into another.
 *
 * Every link the duplicate owned moves to the survivor, including its external
 * identities - which is what makes a later import of the merged record resolve
 * to the survivor instead of resurrecting the duplicate. The duplicate is
 * archived, never deleted: the merge can be explained afterwards, and anything
 * still pointing at that id keeps resolving.
 */
export async function mergePeople(
  actor: Readonly<ActorContext>,
  input: Readonly<MergeRequest>
): Promise<void> {
  if (input.survivorId === input.duplicateId) {
    throw invalidTransition('A record cannot be merged into itself.')
  }

  await db.transaction(async (transaction) => {
    const found = await transaction
      .select({ id: people.id })
      .from(people)
      .where(sql`${people.id} in (${input.survivorId}, ${input.duplicateId})`)

    if (found.length !== 2)
      throw notFound('One of the records no longer exists.')

    await moveLinks(
      transaction,
      'crm_contact_methods',
      'person_id',
      input.survivorId,
      input.duplicateId,
      []
    )
    await moveLinks(
      transaction,
      'crm_person_organisation_relationships',
      'person_id',
      input.survivorId,
      input.duplicateId,
      ['organisation_id', 'relationship_type']
    )
    await moveLinks(
      transaction,
      'crm_case_people',
      'person_id',
      input.survivorId,
      input.duplicateId,
      ['case_id']
    )
    await moveLinks(
      transaction,
      'crm_activities',
      'person_id',
      input.survivorId,
      input.duplicateId,
      []
    )
    await moveLinks(
      transaction,
      'crm_tasks',
      'person_id',
      input.survivorId,
      input.duplicateId,
      []
    )
    await moveLinks(
      transaction,
      'crm_intake_submissions',
      'person_id',
      input.survivorId,
      input.duplicateId,
      []
    )

    await transaction.execute(sql`
      update crm_external_identities
      set entity_id = ${input.survivorId}
      where entity_type = 'person' and entity_id = ${input.duplicateId}
    `)

    await transaction
      .update(people)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(people.id, input.duplicateId))

    await transaction.insert(entityMerges).values({
      entityType: 'person',
      survivorId: input.survivorId,
      mergedId: input.duplicateId,
      actorUserId: actor.userId,
      reason: input.reason ?? null,
    })

    await recordAuditEvent(transaction, actor, {
      action: 'person.merged',
      entityType: 'person',
      entityId: input.survivorId,
      summary: input.reason ?? undefined,
      changes: { mergedId: { from: input.duplicateId, to: null } },
    })
  })
}

export async function mergeOrganisations(
  actor: Readonly<ActorContext>,
  input: Readonly<MergeRequest>
): Promise<void> {
  if (input.survivorId === input.duplicateId) {
    throw invalidTransition('A record cannot be merged into itself.')
  }

  await db.transaction(async (transaction) => {
    const found = await transaction
      .select({ id: organisations.id })
      .from(organisations)
      .where(
        sql`${organisations.id} in (${input.survivorId}, ${input.duplicateId})`
      )

    if (found.length !== 2)
      throw notFound('One of the records no longer exists.')

    await moveLinks(
      transaction,
      'crm_contact_methods',
      'organisation_id',
      input.survivorId,
      input.duplicateId,
      []
    )
    await moveLinks(
      transaction,
      'crm_person_organisation_relationships',
      'organisation_id',
      input.survivorId,
      input.duplicateId,
      ['person_id', 'relationship_type']
    )
    await moveLinks(
      transaction,
      'crm_case_organisations',
      'organisation_id',
      input.survivorId,
      input.duplicateId,
      ['case_id']
    )
    await moveLinks(
      transaction,
      'crm_activities',
      'organisation_id',
      input.survivorId,
      input.duplicateId,
      []
    )
    await moveLinks(
      transaction,
      'crm_tasks',
      'organisation_id',
      input.survivorId,
      input.duplicateId,
      []
    )

    await transaction.execute(sql`
      update crm_external_identities
      set entity_id = ${input.survivorId}
      where entity_type = 'organisation' and entity_id = ${input.duplicateId}
    `)

    await transaction
      .update(organisations)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(organisations.id, input.duplicateId))

    await transaction.insert(entityMerges).values({
      entityType: 'organisation',
      survivorId: input.survivorId,
      mergedId: input.duplicateId,
      actorUserId: actor.userId,
      reason: input.reason ?? null,
    })

    await recordAuditEvent(transaction, actor, {
      action: 'organisation.merged',
      entityType: 'organisation',
      entityId: input.survivorId,
      summary: input.reason ?? undefined,
      changes: { mergedId: { from: input.duplicateId, to: null } },
    })
  })
}
