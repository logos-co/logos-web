import { and, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'

import type { SearchHit, SearchResult } from '@/contracts/search'
import { SEARCH_GROUP_LIMIT } from '@/contracts/search'
import { db } from '@/server/db'
import {
  caseOrganisations,
  cases,
  contactMethods,
  organisations,
  people,
} from '@/server/db/schema'

function contains(term: string): string {
  // Escape the LIKE wildcards so a query containing % or _ searches for those
  // characters instead of matching everything.
  const escaped = term.replace(/[\\%_]/g, (match) => `\\${match}`)
  return `%${escaped}%`
}

function firstDefined(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (value) return value
  }
  return null
}

async function searchCases(pattern: string): Promise<SearchHit[]> {
  const rows = await db
    .select({
      id: cases.id,
      title: cases.title,
      stage: cases.stage,
      profile: cases.profile,
      leadSource: cases.leadSource,
      organisationName: organisations.displayName,
    })
    .from(cases)
    .leftJoin(caseOrganisations, eq(caseOrganisations.caseId, cases.id))
    .leftJoin(
      organisations,
      eq(organisations.id, caseOrganisations.organisationId)
    )
    .where(
      or(
        ilike(cases.title, pattern),
        ilike(cases.stage, pattern),
        ilike(cases.profile, pattern),
        ilike(cases.leadSource, pattern),
        ilike(cases.summary, pattern),
        ilike(organisations.displayName, pattern)
      )
    )
    .limit(SEARCH_GROUP_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: firstDefined(row.organisationName, row.profile, row.stage),
    href: `/cases/${row.id}`,
  }))
}

/**
 * People match on their contact details as well as their names, because that is
 * how a coordinator actually arrives at this screen: with an email address from
 * a thread, not a correctly spelled name.
 */
async function searchPeople(pattern: string): Promise<SearchHit[]> {
  const matchingByContact = db
    .select({ personId: contactMethods.personId })
    .from(contactMethods)
    .where(
      and(
        sql`${contactMethods.personId} is not null`,
        ilike(contactMethods.normalisedValue, pattern)
      )
    )

  const conditions: SQL[] = []
  const nameCondition = or(
    ilike(people.fullName, pattern),
    ilike(people.preferredName, pattern),
    ilike(people.roleTitle, pattern)
  )
  if (nameCondition) conditions.push(nameCondition)

  const rows = await db
    .select({
      id: people.id,
      fullName: people.fullName,
      roleTitle: people.roleTitle,
      contact: sql<string | null>`(
        select cm.display_value
        from ${contactMethods} cm
        where cm.person_id = ${people.id} and cm.type = 'email'
        order by cm.is_preferred desc
        limit 1
      )`,
    })
    .from(people)
    .where(or(...conditions, inArray(people.id, matchingByContact)))
    .limit(SEARCH_GROUP_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    title: row.fullName,
    subtitle: firstDefined(row.roleTitle, row.contact),
    href: `/people/${row.id}`,
  }))
}

async function searchOrganisations(pattern: string): Promise<SearchHit[]> {
  const rows = await db
    .select({
      id: organisations.id,
      displayName: organisations.displayName,
      domain: organisations.domain,
      summary: organisations.summary,
    })
    .from(organisations)
    .where(
      or(
        ilike(organisations.displayName, pattern),
        ilike(organisations.domain, pattern),
        ilike(organisations.website, pattern),
        ilike(organisations.summary, pattern)
      )
    )
    .limit(SEARCH_GROUP_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    title: row.displayName,
    subtitle: firstDefined(row.domain, row.summary),
    href: `/organisations/${row.id}`,
  }))
}

export async function search(term: string): Promise<SearchResult> {
  const pattern = contains(term)

  const [caseHits, peopleHits, organisationHits] = await Promise.all([
    searchCases(pattern),
    searchPeople(pattern),
    searchOrganisations(pattern),
  ])

  return {
    cases: caseHits,
    people: peopleHits,
    organisations: organisationHits,
    total: caseHits.length + peopleHits.length + organisationHits.length,
  }
}
