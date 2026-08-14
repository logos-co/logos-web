'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'

import type {
  RecordScoutReviewInput,
  ScoutCandidateDetail,
  ScoutEvidence,
} from '@/contracts/scout'
import { scoutReviewDecisions } from '@/contracts/values'
import { ApiClientError, apiClient } from '@/lib/api-client'

import { CrmShell } from './crm-shell'
import {
  bandLabels,
  decisionLabels,
  dimensionLabels,
  entityTypeLabels,
  evidenceFieldLabels,
  gateLabels,
  reviewStateLabels,
} from './scout-labels'

interface CandidateResponse {
  item: ScoutCandidateDetail
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(value: string): string {
  return dateFormat.format(new Date(value))
}

function evidenceStatus(item: ScoutEvidence): string {
  if (item.supersededAt) return `Superseded ${formatDate(item.supersededAt)}`
  if (!item.expiresAt) return 'No expiry recorded'
  const expires = new Date(item.expiresAt)
  return expires.getTime() < Date.now()
    ? `Expired ${formatDate(item.expiresAt)}`
    : `Expires ${formatDate(item.expiresAt)}`
}

export function ScoutCandidatePage({ candidateId }: { candidateId: string }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const candidateQuery = useQuery({
    queryKey: ['scout-candidate', candidateId],
    queryFn: () =>
      apiClient<CandidateResponse>(`/api/v1/scout/candidates/${candidateId}`),
  })

  const review = useMutation({
    mutationFn: (input: RecordScoutReviewInput) =>
      apiClient<CandidateResponse>(
        `/api/v1/scout/candidates/${candidateId}/reviews`,
        { method: 'POST', body: JSON.stringify(input) }
      ),
    onSuccess: async () => {
      setReason('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['scout-candidate'] })
      await queryClient.invalidateQueries({ queryKey: ['scout-candidates'] })
    },
    onError: (cause: unknown) => {
      setError(
        cause instanceof ApiClientError
          ? cause.message
          : 'The decision could not be recorded.'
      )
    },
  })

  const item = candidateQuery.data?.item

  if (candidateQuery.isPending) {
    return (
      <CrmShell view="scout">
        <p className="record-empty">Loading the candidate.</p>
      </CrmShell>
    )
  }

  if (!item) {
    return (
      <CrmShell view="scout">
        <p className="record-empty">That candidate no longer exists.</p>
      </CrmShell>
    )
  }

  const decidable =
    item.reviewState !== 'quarantined' && item.reviewState !== 'accepted'

  return (
    <CrmShell view="scout">
      <article className="record-page">
        <Link className="record-back cursor-pointer" href="/scout">
          Back to Scout
        </Link>

        <header className="record-page-header">
          <div>
            <div className="record-page-kicker">
              <span>{entityTypeLabels[item.entityType]}</span>
              <span>{reviewStateLabels[item.reviewState]}</span>
            </div>
            <h1>{item.displayName}</h1>
            <p>{item.domain ?? 'No canonical domain recorded'}</p>
          </div>
        </header>

        <div className="record-page-grid">
          <section className="record-context-card scout-assessment-card">
            <p className="utility-label">Assessment</p>

            {item.assessment ? (
              <>
                <h2 className={`scout-gate-headline ${item.assessment.gate}`}>
                  {gateLabels[item.assessment.gate]}
                </h2>
                <p className="scout-gate-reason">
                  {item.assessment.gateReason}
                </p>

                <ul className="scout-dimensions">
                  {item.assessment.dimensions.map((result) => (
                    <li key={result.dimension}>
                      <div className="scout-dimension-head">
                        <strong>{dimensionLabels[result.dimension]}</strong>
                        <span className={`scout-band-tag ${result.band}`}>
                          {bandLabels[result.band]}
                        </span>
                      </div>
                      <p>{result.reason}</p>
                    </li>
                  ))}
                </ul>

                {item.assessment.conflicts.length > 0 ? (
                  <div className="scout-conflicts">
                    <p className="utility-label">Sources disagree</p>
                    <ul>
                      {item.assessment.conflicts.map((conflict) => (
                        <li key={conflict.field}>
                          <strong>{evidenceFieldLabels[conflict.field]}</strong>
                          <span>{conflict.values.join('  /  ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <p className="scout-rubric-note">
                  Rubric {item.assessment.rubricVersion}, calculated{' '}
                  {formatDate(item.assessment.calculatedAt)}. Bands rank review
                  work. There is no total, and none of this is a partnership
                  decision.
                </p>
              </>
            ) : (
              <p className="record-empty">
                {item.reviewState === 'quarantined'
                  ? 'Quarantined before anything was extracted, so there is nothing to assess.'
                  : 'No assessment has been calculated for this candidate.'}
              </p>
            )}
          </section>

          <section className="record-facts-card">
            <p className="utility-label">Provenance</p>
            <dl className="record-facts">
              <div>
                <dt>First seen</dt>
                <dd>{formatDate(item.firstSeenAt)}</dd>
              </div>
              <div>
                <dt>Last observed</dt>
                <dd>{formatDate(item.lastObservedAt)}</dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>{item.evidenceCount} recorded</dd>
              </div>
              <div>
                <dt>Sources</dt>
                <dd>{item.assessment?.distinctSources ?? 0} distinct</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="record-panel scout-evidence-panel">
          <p className="utility-label">Evidence</p>

          {item.evidence.length === 0 ? (
            <p className="record-empty">
              Nothing was stored about this candidate. A quarantined subject
              looked like a natural person, and the pipeline discards rather
              than files those.
            </p>
          ) : (
            <ul className="scout-evidence-list">
              {item.evidence.map((evidence) => (
                <li key={evidence.id}>
                  <div className="scout-evidence-head">
                    <strong>{evidenceFieldLabels[evidence.field]}</strong>
                    <span>{evidence.value}</span>
                  </div>
                  <blockquote>{evidence.excerpt}</blockquote>
                  <div className="scout-evidence-meta">
                    <a
                      className="cursor-pointer"
                      href={evidence.sourceUrl}
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      {evidence.sourceTitle ?? evidence.sourceUrl}
                    </a>
                    <span>
                      {evidence.extractionMethod} · {evidence.extractorVersion}
                    </span>
                    <span>{evidence.certainty}</span>
                    <span>Observed {formatDate(evidence.observedAt)}</span>
                    <span>{evidenceStatus(evidence)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="record-panel scout-review-panel">
          <p className="utility-label">Decision</p>

          {decidable ? (
            <>
              <p className="scout-review-note">
                Accepting records that this candidate is worth pursuing. It
                creates no organisation, no person, no case, and no task: Scout
                has no write path into the CRM in this phase.
              </p>

              <label className="scout-reason-field">
                <span>Reason</span>
                <textarea
                  placeholder="Why this decision?"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>

              <div className="scout-review-actions">
                {scoutReviewDecisions.map((decision) => (
                  <button
                    className="cursor-pointer"
                    disabled={reason.trim().length < 3 || review.isPending}
                    key={decision}
                    type="button"
                    onClick={() =>
                      review.mutate({ decision, reason: reason.trim() })
                    }
                  >
                    {decisionLabels[decision]}
                  </button>
                ))}
              </div>

              {error ? <p className="form-error">{error}</p> : null}
            </>
          ) : (
            <p className="record-empty">
              {item.reviewState === 'quarantined'
                ? 'A quarantined candidate cannot be reviewed. Nothing was kept about it.'
                : 'This candidate has been accepted. A change of mind needs a new assessment.'}
            </p>
          )}

          {item.reviews.length > 0 ? (
            <ul className="scout-review-history">
              {item.reviews.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>{decisionLabels[entry.decision]}</strong>
                    <span>
                      {entry.reviewer?.displayName ?? 'Unattributed'} ·{' '}
                      {formatDate(entry.reviewedAt)}
                    </span>
                  </div>
                  <p>{entry.reason}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </article>
    </CrmShell>
  )
}
