'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { apiClient } from '@/lib/api-client'
import type { ScoutReport } from '@/server/scout-report-repository'

import { CrmShell } from './crm-shell'
import { decisionLabels, reviewStateLabels } from './scout-labels'

interface ReportResponse {
  item: ScoutReport
}

function metricEntries(
  values: Record<string, number>,
  labels: Record<string, string>
): Array<[string, number]> {
  return Object.entries(values).map(([key, value]) => [
    labels[key] ?? key,
    value,
  ])
}

export function ScoutReportView() {
  const reportQuery = useQuery({
    queryKey: ['scout-report'],
    queryFn: () => apiClient<ReportResponse>('/api/v1/scout/report'),
  })

  const report = reportQuery.data?.item

  return (
    <CrmShell view="scout">
      <article className="record-page scout-report-page">
        <Link className="record-back cursor-pointer" href="/scout">
          Back to Scout
        </Link>
        <header className="record-page-header">
          <div>
            <div className="record-page-kicker">Internal review report</div>
            <h1>Scout quality and workflow</h1>
            <p>
              Operational aggregates only. This report contains no source
              excerpts, candidate notes, or personal information.
            </p>
          </div>
        </header>

        {!report ? (
          <p className="record-empty">
            {reportQuery.isError
              ? 'The report could not be loaded.'
              : 'Loading report.'}
          </p>
        ) : (
          <>
            <section className="scout-report-hero">
              <div>
                <span>Discovery runs</span>
                <strong>{report.discovery.runs}</strong>
              </div>
              <div>
                <span>Candidates added</span>
                <strong>{report.discovery.discovered}</strong>
              </div>
              <div>
                <span>Quarantined</span>
                <strong>{report.discovery.quarantined}</strong>
              </div>
              <div>
                <span>Duplicates skipped</span>
                <strong>{report.discovery.duplicates}</strong>
              </div>
              <div>
                <span>Source failures</span>
                <strong>{report.discovery.failures}</strong>
              </div>
            </section>

            <div className="scout-report-grid">
              <section>
                <p className="utility-label">Queue state</p>
                <dl>
                  {metricEntries(report.candidateStates, reviewStateLabels).map(
                    ([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    )
                  )}
                </dl>
              </section>
              <section>
                <p className="utility-label">Review decisions</p>
                <dl>
                  {metricEntries(report.decisions, decisionLabels).map(
                    ([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    )
                  )}
                </dl>
              </section>
              <section>
                <p className="utility-label">Evidence gate</p>
                <dl>
                  {metricEntries(report.evidenceGates, {
                    sufficient: 'Sufficient',
                    insufficient: 'Insufficient',
                    conflicted: 'Conflicted',
                  }).map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section>
                <p className="utility-label">Product signals</p>
                <dl>
                  {metricEntries(report.events, {
                    candidate_opened: 'Candidate opens',
                    source_opened: 'Source opens',
                    comparison_opened: 'Comparisons',
                    review_recorded: 'Recorded reviews',
                  }).map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                  <div>
                    <dt>Measured reviews</dt>
                    <dd>{report.reviewTiming.measuredReviews}</dd>
                  </div>
                  <div>
                    <dt>Median open-to-decision</dt>
                    <dd>
                      {report.reviewTiming.medianMinutes === null
                        ? 'Not enough data'
                        : `${report.reviewTiming.medianMinutes} min`}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            <p className="scout-report-generated">
              Generated {new Date(report.generatedAt).toLocaleString('en-GB')}
            </p>
          </>
        )}
      </article>
    </CrmShell>
  )
}
