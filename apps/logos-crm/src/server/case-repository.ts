import { and, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm'

import type { CaseRecord, CaseStatus, CreateCaseInput } from '@/contracts/case'
import { db } from '@/server/db'
import {
  caseOrganisations,
  casePeople,
  cases,
  organisations,
  people,
} from '@/server/db/schema'

export interface CaseListFilters {
  q?: string
  status?: CaseStatus
}

interface CaseRelations {
  organisationId: string | null
  relatedPeople: CaseRecord['relatedPeople']
}

function toCaseRecord(
  row: typeof cases.$inferSelect,
  relations: CaseRelations
): CaseRecord {
  return {
    ...row,
    ...relations,
    nextActionAt: row.nextActionAt.toISOString(),
    lastContactAt: row.lastContactAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function hydrateCaseRecords(
  rows: ReadonlyArray<typeof cases.$inferSelect>
): Promise<CaseRecord[]> {
  if (rows.length === 0) return []
  const ids = rows.map((row) => row.id)
  const [organisationLinks, peopleLinks] = await Promise.all([
    db
      .select({
        caseId: caseOrganisations.caseId,
        organisationId: caseOrganisations.organisationId,
        primary: caseOrganisations.isPrimary,
      })
      .from(caseOrganisations)
      .where(inArray(caseOrganisations.caseId, ids)),
    db
      .select({
        caseId: casePeople.caseId,
        id: people.id,
        fullName: people.fullName,
        roleTitle: people.roleTitle,
        primary: casePeople.isPrimary,
      })
      .from(casePeople)
      .innerJoin(people, eq(casePeople.personId, people.id))
      .where(inArray(casePeople.caseId, ids)),
  ])
  const organisationByCase = new Map(
    [...organisationLinks]
      .sort((left, right) => Number(right.primary) - Number(left.primary))
      .map((row) => [row.caseId, row.organisationId])
  )
  const peopleByCase = new Map<string, CaseRecord['relatedPeople']>()
  for (const link of [...peopleLinks].sort(
    (left, right) => Number(right.primary) - Number(left.primary)
  )) {
    const existing = peopleByCase.get(link.caseId) ?? []
    peopleByCase.set(link.caseId, [
      ...existing,
      { id: link.id, fullName: link.fullName, roleTitle: link.roleTitle },
    ])
  }

  return rows.map((row) =>
    toCaseRecord(row, {
      organisationId: organisationByCase.get(row.id) ?? null,
      relatedPeople: peopleByCase.get(row.id) ?? [],
    })
  )
}

export async function listCases(
  filters: Readonly<CaseListFilters> = {}
): Promise<CaseRecord[]> {
  const conditions: SQL[] = []

  if (filters.status) {
    conditions.push(eq(cases.status, filters.status))
  }

  if (filters.q) {
    const query = `%${filters.q}%`
    const searchCondition = or(
      ilike(cases.title, query),
      ilike(cases.organisation, query),
      ilike(cases.owner, query)
    )
    if (searchCondition) conditions.push(searchCondition)
  }

  const rows = await db
    .select()
    .from(cases)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(cases.updatedAt))

  return hydrateCaseRecords(rows)
}

export async function createCase(
  input: Readonly<CreateCaseInput>
): Promise<CaseRecord> {
  const created = await db.transaction(async (transaction) => {
    const { organisationId, personIds, ...caseInput } = input
    const [organisation] = organisationId
      ? await transaction
          .select({ displayName: organisations.displayName })
          .from(organisations)
          .where(eq(organisations.id, organisationId))
          .limit(1)
      : []
    const [row] = await transaction
      .insert(cases)
      .values({
        ...caseInput,
        organisation: organisation?.displayName ?? caseInput.organisation,
        nextActionAt: new Date(caseInput.nextActionAt),
        status: 'new',
      })
      .returning()

    if (!row) throw new Error('The case was not created.')
    if (organisationId) {
      await transaction.insert(caseOrganisations).values({
        caseId: row.id,
        organisationId,
        isPrimary: true,
      })
    }
    if (personIds.length > 0) {
      await transaction.insert(casePeople).values(
        personIds.map((personId, index) => ({
          caseId: row.id,
          personId,
          isPrimary: index === 0,
        }))
      )
    }
    return row
  })

  const [record] = await hydrateCaseRecords([created])
  if (!record) throw new Error('The case was not created.')
  return record
}

export async function updateCaseStatus(
  id: string,
  status: CaseStatus
): Promise<CaseRecord | null> {
  const [updated] = await db
    .update(cases)
    .set({ status, updatedAt: new Date() })
    .where(eq(cases.id, id))
    .returning()

  if (!updated) return null
  return (await hydrateCaseRecords([updated]))[0] ?? null
}

export async function getDashboardSummary(): Promise<{
  total: number
  byStatus: Record<CaseStatus, number>
}> {
  const rows = await db
    .select({ status: cases.status, value: count() })
    .from(cases)
    .groupBy(cases.status)

  const byStatus: Record<CaseStatus, number> = {
    new: 0,
    in_progress: 0,
    waiting: 0,
    resolved: 0,
    closed: 0,
  }

  for (const row of rows) byStatus[row.status] = row.value

  return {
    total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
    byStatus,
  }
}
