import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm'

import type { CaseRecord, CaseStatus, CreateCaseInput } from '@/contracts/case'
import { db } from '@/server/db'
import { cases } from '@/server/db/schema'

export interface CaseListFilters {
  q?: string
  status?: CaseStatus
}

function toCaseRecord(row: typeof cases.$inferSelect): CaseRecord {
  return {
    ...row,
    nextActionAt: row.nextActionAt.toISOString(),
    lastContactAt: row.lastContactAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
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

  return rows.map(toCaseRecord)
}

export async function createCase(
  input: Readonly<CreateCaseInput>
): Promise<CaseRecord> {
  const [created] = await db
    .insert(cases)
    .values({
      ...input,
      nextActionAt: new Date(input.nextActionAt),
      status: 'new',
    })
    .returning()

  if (!created) throw new Error('The case was not created.')
  return toCaseRecord(created)
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

  return updated ? toCaseRecord(updated) : null
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
