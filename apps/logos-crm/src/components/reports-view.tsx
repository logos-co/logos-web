'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import type {
  ReportBreakdown,
  ReportBucket,
  ReportResult,
} from '@/contracts/report'
import { apiClient } from '@/lib/api-client'

import { CrmShell } from './crm-shell'
import { ExportButton } from './export-button'

const DAY = 24 * 60 * 60 * 1000

const cohortPresets = [
  { label: 'Last 30 days', days: 30, bucket: 'day' as ReportBucket },
  { label: 'Last 90 days', days: 90, bucket: 'week' as ReportBucket },
  { label: 'Last 12 months', days: 365, bucket: 'month' as ReportBucket },
]

function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

function BreakdownBars({
  items,
  emptyLabel,
}: {
  items: ReportBreakdown[]
  emptyLabel: string
}) {
  const max = Math.max(...items.map((item) => item.count), 0)

  if (items.length === 0) {
    return <p className="record-empty">{emptyLabel}</p>
  }

  return (
    <ul className="report-bars">
      {items.map((item) => (
        <li key={item.key}>
          <span className="report-bar-label">{item.label}</span>
          <span className="report-bar-track">
            <span
              className="report-bar-fill"
              // Zero-count rows keep their row and label rather than vanishing:
              // "none" and "not measured" must not look the same.
              style={{ width: max > 0 ? `${(item.count / max) * 100}%` : '0%' }}
            />
          </span>
          <b>{item.count}</b>
        </li>
      ))}
    </ul>
  )
}

export function ReportsView() {
  const [presetIndex, setPresetIndex] = useState(1)
  const preset = cohortPresets[presetIndex] ?? cohortPresets[1]
  const timezone = localTimezone()

  /**
   * Pinned when the period is chosen, not read on every render. A report whose
   * `as_of` moves each render is a different question each time — and as the
   * query key, it would refetch forever.
   */
  const window = useMemo(() => {
    const now = Date.now()
    return {
      cohortFrom: new Date(now - (preset?.days ?? 90) * DAY).toISOString(),
      cohortTo: new Date(now).toISOString(),
      asOf: new Date(now).toISOString(),
    }
  }, [preset])

  const { cohortFrom, cohortTo, asOf } = window
  const bucket = preset?.bucket ?? 'week'

  const reportQuery = useQuery({
    queryKey: ['report', 'funnel', cohortFrom, bucket, timezone],
    queryFn: () => {
      const params = new URLSearchParams({
        cohort_from: cohortFrom,
        cohort_to: cohortTo,
        as_of: asOf,
        timezone,
        bucket,
      })
      return apiClient<{ item: ReportResult }>(
        `/api/v1/reports/funnel?${params.toString()}`
      )
    },
  })

  const report = reportQuery.data?.item

  return (
    <CrmShell view="reports">
      <header className="workspace-header">
        <h1>Reports</h1>
        <ExportButton
          request={{
            resource: 'report_funnel',
            filters: { cohortFrom, cohortTo, asOf, timezone, bucket },
          }}
        />
      </header>

      <nav className="queue-tabs" aria-label="Reporting period">
        {cohortPresets.map((item, index) => (
          <button
            aria-pressed={presetIndex === index}
            className={`queue-tab cursor-pointer ${presetIndex === index ? 'selected' : ''}`}
            key={item.label}
            type="button"
            onClick={() => setPresetIndex(index)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <p className="report-contract">
        Cases created in the selected window, counted as they stood at{' '}
        {new Date(asOf).toLocaleString('en-GB')} · {timezone}
      </p>

      {reportQuery.isLoading && <p className="record-empty">Loading report…</p>}
      {reportQuery.isError && (
        <p className="record-empty">The report could not be loaded.</p>
      )}

      {report && (
        <div className="report-grid">
          <section className="report-card">
            <p className="utility-label">Cohort</p>
            <strong className="report-headline">{report.cohortTotal}</strong>
            <p className="report-note">
              {report.historyCoverageGap > 0
                ? `${report.historyCoverageGap} imported without observed history — excluded from duration metrics`
                : 'All cases in this cohort have observed history'}
            </p>
          </section>

          <section className="report-card">
            <p className="utility-label">Status at that moment</p>
            <BreakdownBars
              items={report.statusAtAsOf}
              emptyLabel="No cases in this cohort."
            />
          </section>

          <section className="report-card">
            <p className="utility-label">Decisions</p>
            <BreakdownBars
              items={report.decisions}
              emptyLabel="No cases in this cohort."
            />
          </section>

          <section className="report-card">
            <p className="utility-label">Owner at that moment</p>
            <BreakdownBars
              items={report.ownersAtAsOf}
              emptyLabel="No cases in this cohort."
            />
          </section>

          <section className="report-card report-wide">
            <p className="utility-label">Intake over time</p>
            <BreakdownBars
              items={report.intakeOverTime}
              emptyLabel="No submissions in this window."
            />
          </section>
        </div>
      )}
    </CrmShell>
  )
}
