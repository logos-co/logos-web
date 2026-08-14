import { sql } from 'drizzle-orm'

import type { ReportQuery, ReportResult } from '@/contracts/report'
import {
  decisionLabelsForReport,
  statusLabelsForReport,
} from '@/contracts/report'
import { caseDecisions, caseStatuses } from '@/contracts/values'
import { db } from '@/server/db'

type CountRow = Record<string, unknown> & {
  key: string | null
  count: number
}

type TotalRow = Record<string, unknown> & { count: number }

/**
 * Reporting reads history, not current state.
 *
 * The case row only knows where a case is now. "How many of the cases we took
 * in during March were still open at the end of April" is a question about a
 * past moment, and the only place that answer exists is
 * `crm_case_workflow_history` and `crm_case_assignments`. Reading the case row
 * instead would quietly answer a different question — the one about today — and
 * look plausible while doing it.
 */
export async function getFunnelReport(
  query: Readonly<ReportQuery>
): Promise<ReportResult> {
  const cohortFrom = new Date(query.cohortFrom)
  const cohortTo = new Date(query.cohortTo)
  const asOf = new Date(query.asOf)

  const cohort = sql`
    select id, created_at
    from crm_cases
    where created_at >= ${cohortFrom} and created_at <= ${cohortTo}
  `

  const [totalRows, statusRows, decisionRows, ownerRows, intakeRows, gapRows] =
    await Promise.all([
      db.execute<TotalRow>(sql`
        select count(*)::int as count from (${cohort}) as cohort
      `),

      // The last transition that had happened by as_of is the status then.
      db.execute<CountRow>(sql`
        select history.to_status as key, count(*)::int as count
        from (${cohort}) as cohort
        join lateral (
          select h.to_status
          from crm_case_workflow_history h
          where h.case_id = cohort.id and h.effective_at <= ${asOf}
          order by h.effective_at desc, h.sequence desc
          limit 1
        ) as history on true
        group by history.to_status
      `),

      db.execute<CountRow>(sql`
        select c.decision as key, count(*)::int as count
        from (${cohort}) as cohort
        join crm_cases c on c.id = cohort.id
        group by c.decision
      `),

      // Ownership is an interval, so "who owned it then" is the interval that
      // contained as_of. Unassigned is a real answer and gets its own bucket.
      db.execute<CountRow>(sql`
        select coalesce(u.display_name, 'Unassigned') as key, count(*)::int as count
        from (${cohort}) as cohort
        left join lateral (
          select a.owner_user_id
          from crm_case_assignments a
          where a.case_id = cohort.id
            and a.valid_from <= ${asOf}
            and (a.valid_to is null or a.valid_to > ${asOf})
          order by a.valid_from desc
          limit 1
        ) as assignment on true
        left join crm_users u on u.id = assignment.owner_user_id
        group by coalesce(u.display_name, 'Unassigned')
        order by count(*) desc
      `),

      // Bucketed in the requested timezone: where a day starts changes which
      // bucket a submission lands in, and therefore the shape of the chart.
      db.execute<CountRow>(sql`
        select to_char(
                 date_trunc(${query.bucket}, cohort.created_at at time zone ${query.timezone}),
                 'YYYY-MM-DD'
               ) as key,
               count(*)::int as count
        from (${cohort}) as cohort
        group by 1
        order by 1
      `),

      db.execute<TotalRow>(sql`
        select count(*)::int as count
        from (${cohort}) as cohort
        where exists (
          select 1 from crm_case_workflow_history h
          where h.case_id = cohort.id and h.source = 'import'
        )
      `),
    ])

  const countByKey = (rows: readonly CountRow[]): Map<string, number> =>
    new Map(rows.map((row) => [row.key ?? 'unknown', Number(row.count)]))

  const statusCounts = countByKey(statusRows.rows)
  const decisionCounts = countByKey(decisionRows.rows)

  return {
    cohortTotal: Number(totalRows.rows[0]?.count ?? 0),
    // Every status is listed even at zero: a missing row reads as "no data"
    // when it means "none", and the two look identical in a chart.
    statusAtAsOf: caseStatuses.map((status) => ({
      key: status,
      label: statusLabelsForReport[status],
      count: statusCounts.get(status) ?? 0,
    })),
    decisions: caseDecisions.map((decision) => ({
      key: decision,
      label: decisionLabelsForReport[decision],
      count: decisionCounts.get(decision) ?? 0,
    })),
    ownersAtAsOf: ownerRows.rows.map((row) => ({
      key: row.key ?? 'Unassigned',
      label: row.key ?? 'Unassigned',
      count: Number(row.count),
    })),
    intakeOverTime: intakeRows.rows.map((row) => ({
      key: row.key ?? '',
      label: row.key ?? '',
      count: Number(row.count),
    })),
    historyCoverageGap: Number(gapRows.rows[0]?.count ?? 0),
  }
}
