import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'

import type {
  CreateOrganisationInput,
  CreatePersonInput,
  OrganisationRecord,
  PersonRecord,
  UpdateOrganisationInput,
  UpdatePersonInput,
} from '@/contracts/directory'
import { LIST_LIMIT_DEFAULT } from '@/contracts/case'
import { db } from '@/server/db'
import {
  caseOrganisations,
  casePeople,
  contactMethods,
  organisations,
  people,
  personOrganisationRelationships,
} from '@/server/db/schema'

export interface DirectoryListFilters {
  q?: string
  limit?: number
}

function normaliseName(value: string): string {
  return value.trim().toLocaleLowerCase('en').replace(/\s+/g, ' ')
}

function normaliseContact(value: string, type: 'email' | 'phone'): string {
  return type === 'email'
    ? value.trim().toLocaleLowerCase('en')
    : value.replace(/[^\d+]/g, '')
}

/** The transaction handle both callers already hold. */
type OrganisationWriter = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Resolves a typed organisation name to a record, creating one if the name is
 * new. Matching is on the normalised name, so "Cypherpunk Guild Berlin" typed
 * twice with different capitalisation is one organisation rather than two.
 *
 * Takes a transaction because both callers - public intake and case creation -
 * need the organisation to commit with the thing that referenced it.
 */
export async function findOrCreateOrganisation(
  transaction: OrganisationWriter,
  name: string
): Promise<string> {
  const normalisedName = normaliseName(name)

  const [existing] = await transaction
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.normalisedName, normalisedName))
    .limit(1)

  if (existing) return existing.id

  const [created] = await transaction
    .insert(organisations)
    .values({ displayName: name.trim(), normalisedName, status: 'prospect' })
    .returning()

  if (!created) throw new Error('The organisation record was not created.')
  return created.id
}

export async function listOrganisations(
  filters: Readonly<DirectoryListFilters> = {}
): Promise<OrganisationRecord[]> {
  const condition = filters.q
    ? or(
        ilike(organisations.displayName, `%${filters.q}%`),
        ilike(organisations.domain, `%${filters.q}%`)
      )
    : undefined

  const rows = await db
    .select()
    .from(organisations)
    .where(condition)
    .orderBy(asc(organisations.displayName))
    .limit(filters.limit ?? LIST_LIMIT_DEFAULT)

  if (rows.length === 0) return []
  const ids = rows.map((row) => row.id)
  const [contactCounts, caseCounts] = await Promise.all([
    db
      .select({
        id: personOrganisationRelationships.organisationId,
        value: count(),
      })
      .from(personOrganisationRelationships)
      .where(inArray(personOrganisationRelationships.organisationId, ids))
      .groupBy(personOrganisationRelationships.organisationId),
    db
      .select({ id: caseOrganisations.organisationId, value: count() })
      .from(caseOrganisations)
      .where(inArray(caseOrganisations.organisationId, ids))
      .groupBy(caseOrganisations.organisationId),
  ])
  const contactCountById = new Map(
    contactCounts.map((row) => [row.id, row.value])
  )
  const caseCountById = new Map(caseCounts.map((row) => [row.id, row.value]))

  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName,
    domain: row.domain,
    website: row.website,
    status: row.status,
    summary: row.summary,
    contactCount: contactCountById.get(row.id) ?? 0,
    linkedCaseCount: caseCountById.get(row.id) ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function listPeople(
  filters: Readonly<DirectoryListFilters> = {}
): Promise<PersonRecord[]> {
  const conditions: SQL[] = []
  if (filters.q) {
    const query = `%${filters.q}%`
    const search = or(
      ilike(people.fullName, query),
      ilike(people.preferredName, query),
      ilike(people.roleTitle, query),
      sql<boolean>`exists (
        select 1 from ${contactMethods}
        where ${contactMethods.personId} = ${people.id}
          and ${contactMethods.displayValue} ilike ${query}
      )`,
      sql<boolean>`exists (
        select 1
        from ${personOrganisationRelationships}
        inner join ${organisations}
          on ${organisations.id} = ${personOrganisationRelationships.organisationId}
        where ${personOrganisationRelationships.personId} = ${people.id}
          and ${organisations.displayName} ilike ${query}
      )`
    )
    if (search) conditions.push(search)
  }

  const rows = await db
    .select()
    .from(people)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(people.fullName))
    .limit(filters.limit ?? LIST_LIMIT_DEFAULT)

  if (rows.length === 0) return []
  const ids = rows.map((row) => row.id)
  const [methods, relationships, caseCounts] = await Promise.all([
    db
      .select({
        personId: contactMethods.personId,
        type: contactMethods.type,
        value: contactMethods.displayValue,
        preferred: contactMethods.isPreferred,
      })
      .from(contactMethods)
      .where(inArray(contactMethods.personId, ids)),
    db
      .select({
        personId: personOrganisationRelationships.personId,
        organisationId: organisations.id,
        organisationName: organisations.displayName,
        primary: personOrganisationRelationships.isPrimary,
      })
      .from(personOrganisationRelationships)
      .innerJoin(
        organisations,
        eq(personOrganisationRelationships.organisationId, organisations.id)
      )
      .where(inArray(personOrganisationRelationships.personId, ids)),
    db
      .select({ id: casePeople.personId, value: count() })
      .from(casePeople)
      .where(inArray(casePeople.personId, ids))
      .groupBy(casePeople.personId),
  ])
  const methodsByPerson = new Map<string, typeof methods>()
  for (const method of methods) {
    if (!method.personId) continue
    const existing = methodsByPerson.get(method.personId) ?? []
    methodsByPerson.set(method.personId, [...existing, method])
  }
  const relationshipByPerson = new Map(
    [...relationships]
      .sort((left, right) => Number(right.primary) - Number(left.primary))
      .map((row) => [row.personId, row])
  )
  const caseCountById = new Map(caseCounts.map((row) => [row.id, row.value]))

  return rows.map((row) => {
    const personMethods = methodsByPerson.get(row.id) ?? []
    const relationship = relationshipByPerson.get(row.id)
    return {
      id: row.id,
      fullName: row.fullName,
      preferredName: row.preferredName,
      roleTitle: row.roleTitle,
      status: row.status,
      summary: row.summary,
      email:
        personMethods.find(
          (method) => method.type === 'email' && method.preferred
        )?.value ??
        personMethods.find((method) => method.type === 'email')?.value ??
        null,
      phone:
        personMethods.find(
          (method) => method.type === 'phone' && method.preferred
        )?.value ??
        personMethods.find((method) => method.type === 'phone')?.value ??
        null,
      organisationId: relationship?.organisationId ?? null,
      organisationName: relationship?.organisationName ?? null,
      linkedCaseCount: caseCountById.get(row.id) ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  })
}

export async function createOrganisation(
  input: Readonly<CreateOrganisationInput>
): Promise<OrganisationRecord> {
  const [created] = await db
    .insert(organisations)
    .values({
      displayName: input.displayName,
      normalisedName: normaliseName(input.displayName),
      domain: input.domain || null,
      website: input.website || null,
      status: input.status ?? 'prospect',
      summary: input.summary || null,
    })
    .returning()

  if (!created) throw new Error('The organisation was not created.')
  return {
    id: created.id,
    displayName: created.displayName,
    domain: created.domain,
    website: created.website,
    status: created.status,
    summary: created.summary,
    contactCount: 0,
    linkedCaseCount: 0,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  }
}

export async function createPerson(
  input: Readonly<CreatePersonInput>
): Promise<PersonRecord> {
  const personId = await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(people)
      .values({
        fullName: input.fullName,
        preferredName: input.preferredName || null,
        roleTitle: input.roleTitle || null,
        status: input.status ?? 'prospect',
        summary: input.summary || null,
      })
      .returning({ id: people.id })

    if (!created) throw new Error('The person was not created.')
    const methods = [
      ...(input.email
        ? [
            {
              personId: created.id,
              type: 'email' as const,
              displayValue: input.email,
              normalisedValue: normaliseContact(input.email, 'email'),
              label: 'Work',
              isPreferred: true,
            },
          ]
        : []),
      ...(input.phone
        ? [
            {
              personId: created.id,
              type: 'phone' as const,
              displayValue: input.phone,
              normalisedValue: normaliseContact(input.phone, 'phone'),
              label: 'Work',
              isPreferred: true,
            },
          ]
        : []),
    ]
    if (methods.length > 0)
      await transaction.insert(contactMethods).values(methods)
    if (input.organisationId) {
      await transaction.insert(personOrganisationRelationships).values({
        personId: created.id,
        organisationId: input.organisationId,
        title: input.roleTitle || null,
        isPrimary: true,
      })
    }
    return created.id
  })

  const item = (await listPeople()).find((row) => row.id === personId)
  if (!item) throw new Error('The person was not created.')
  return item
}

export async function getOrganisation(
  id: string
): Promise<OrganisationRecord | null> {
  return (await listOrganisations()).find((row) => row.id === id) ?? null
}

export async function getPerson(id: string): Promise<PersonRecord | null> {
  return (await listPeople()).find((row) => row.id === id) ?? null
}

export async function updateOrganisation(
  id: string,
  input: Readonly<UpdateOrganisationInput>
): Promise<OrganisationRecord | null> {
  const [updated] = await db
    .update(organisations)
    .set({
      ...(input.displayName !== undefined
        ? {
            displayName: input.displayName,
            normalisedName: normaliseName(input.displayName),
          }
        : {}),
      ...(input.domain !== undefined ? { domain: input.domain || null } : {}),
      ...(input.website !== undefined
        ? { website: input.website || null }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.summary !== undefined
        ? { summary: input.summary || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, id))
    .returning({ id: organisations.id })

  return updated ? getOrganisation(updated.id) : null
}

export async function updatePerson(
  id: string,
  input: Readonly<UpdatePersonInput>
): Promise<PersonRecord | null> {
  const existing = await getPerson(id)
  if (!existing) return null

  await db.transaction(async (transaction) => {
    await transaction
      .update(people)
      .set({
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.preferredName !== undefined
          ? { preferredName: input.preferredName || null }
          : {}),
        ...(input.roleTitle !== undefined
          ? { roleTitle: input.roleTitle || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.summary !== undefined
          ? { summary: input.summary || null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(people.id, id))

    for (const type of ['email', 'phone'] as const) {
      const value = input[type]
      if (value === undefined) continue
      await transaction
        .delete(contactMethods)
        .where(
          and(eq(contactMethods.personId, id), eq(contactMethods.type, type))
        )
      if (value) {
        await transaction.insert(contactMethods).values({
          personId: id,
          type,
          displayValue: value,
          normalisedValue: normaliseContact(value, type),
          label: 'Work',
          isPreferred: true,
        })
      }
    }

    if (input.organisationId !== undefined) {
      await transaction
        .delete(personOrganisationRelationships)
        .where(eq(personOrganisationRelationships.personId, id))
      if (input.organisationId) {
        await transaction.insert(personOrganisationRelationships).values({
          personId: id,
          organisationId: input.organisationId,
          title: input.roleTitle ?? existing.roleTitle,
          isPrimary: true,
        })
      }
    } else if (input.roleTitle !== undefined) {
      await transaction
        .update(personOrganisationRelationships)
        .set({ title: input.roleTitle || null })
        .where(eq(personOrganisationRelationships.personId, id))
    }
  })

  return getPerson(id)
}
