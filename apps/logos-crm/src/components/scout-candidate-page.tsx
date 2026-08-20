'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import {
  scoutReasonCategories,
  type RecordScoutReviewInput,
  type ScoutCandidateDetail,
  type ScoutCandidateSummary,
  type ScoutEvidence,
} from '@/contracts/scout'
import { scoutEvidenceFields, scoutReviewDecisions } from '@/contracts/values'
import { ApiClientError, apiClient } from '@/lib/api-client'
import { recordScoutUiEvent } from '@/lib/scout-events'

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

interface CandidateListResponse {
  items: ScoutCandidateSummary[]
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const reasonCategoryLabels: Record<
  (typeof scoutReasonCategories)[number],
  string
> = {
  relevant_work: 'Relevant work',
  active_project: 'Active project',
  duplicate: 'Duplicate',
  out_of_scope: 'Out of scope',
  insufficient_evidence: 'Insufficient evidence',
  other: 'Other',
}

const evidenceGroups = [
  {
    title: 'What does this organisation work on?',
    fields: ['official_site', 'theme_match', 'governance_model'],
  },
  { title: 'Is it currently active?', fields: ['recent_release'] },
  {
    title: 'Can outsiders contribute?',
    fields: ['public_repository', 'public_documentation', 'contribution_path'],
  },
  {
    title: 'How is it connected to the ecosystem?',
    fields: ['ecosystem_relation'],
  },
] as const

const decisionShortcuts = {
  accept: 'Alt+A',
  watch: 'Alt+W',
  reject: 'Alt+R',
  needs_evidence: 'Alt+E',
} as const

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
  const router = useRouter()
  const queryClient = useQueryClient()
  const openedCandidate = useRef<string | null>(null)
  const [reasonCategory, setReasonCategory] = useState('')
  const [reason, setReason] = useState('')
  const [evidenceFields, setEvidenceFields] = useState<string[]>([])
  const [continueToNext, setContinueToNext] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const candidateQuery = useQuery({
    queryKey: ['scout-candidate', candidateId],
    queryFn: () =>
      apiClient<CandidateResponse>(`/api/v1/scout/candidates/${candidateId}`),
  })

  const queueQuery = useQuery({
    queryKey: ['scout-candidates', 'review-session'],
    queryFn: () => apiClient<CandidateListResponse>('/api/v1/scout/candidates'),
  })

  const queue = useMemo(
    () =>
      (queueQuery.data?.items ?? []).filter(
        (candidate) =>
          candidate.reviewState !== 'quarantined' &&
          candidate.reviewState !== 'accepted'
      ),
    [queueQuery.data?.items]
  )
  const currentIndex = queue.findIndex(
    (candidate) => candidate.id === candidateId
  )
  const nextCandidate =
    currentIndex >= 0 ? (queue[currentIndex + 1] ?? queue[0] ?? null) : null

  useEffect(() => {
    if (!candidateQuery.data || openedCandidate.current === candidateId) return
    openedCandidate.current = candidateId
    recordScoutUiEvent({
      eventType: 'candidate_opened',
      candidateId,
      metadata: {},
    })
  }, [candidateId, candidateQuery.data])

  const review = useMutation({
    mutationFn: (input: RecordScoutReviewInput) =>
      apiClient<CandidateResponse>(
        `/api/v1/scout/candidates/${candidateId}/reviews`,
        { method: 'POST', body: JSON.stringify(input) }
      ),
    onSuccess: async () => {
      setReason('')
      setReasonCategory('')
      setEvidenceFields([])
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['scout-candidate'] })
      await queryClient.invalidateQueries({ queryKey: ['scout-candidates'] })
      if (continueToNext && nextCandidate && nextCandidate.id !== candidateId) {
        router.push(`/scout/${nextCandidate.id}`)
      }
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
  const canAccept = item.assessment?.gate === 'sufficient'
  const commonDecisionReady =
    reasonCategory.length > 0 && reason.trim().length >= 3 && !review.isPending

  function toggleEvidenceField(field: string): void {
    setEvidenceFields((current) =>
      current.includes(field)
        ? current.filter((value) => value !== field)
        : [...current, field]
    )
  }

  function decide(decision: (typeof scoutReviewDecisions)[number]): void {
    review.mutate({
      decision,
      reasonCategory: reasonCategory as (typeof scoutReasonCategories)[number],
      reason: reason.trim(),
      evidenceFields:
        decision === 'needs_evidence'
          ? (evidenceFields as RecordScoutReviewInput['evidenceFields'])
          : undefined,
    })
  }

  function handleShortcut(event: KeyboardEvent<HTMLElement>): void {
    if (!event.altKey || event.metaKey || event.ctrlKey) return
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return
    }

    const decision = scoutReviewDecisions.find(
      (value) => decisionShortcuts[value] === `Alt+${event.key.toUpperCase()}`
    )
    if (!decision || !commonDecisionReady) return
    if (decision === 'accept' && !canAccept) return
    if (decision === 'needs_evidence' && evidenceFields.length === 0) return
    event.preventDefault()
    decide(decision)
  }

  return (
    <CrmShell view="scout">
      <article
        className="record-page scout-record-page"
        onKeyDown={handleShortcut}
      >
        <div className="scout-session-nav">
          <Link className="record-back cursor-pointer" href="/scout">
            Back to Scout
          </Link>
          {currentIndex >= 0 ? (
            <span>
              Candidate {currentIndex + 1} of {queue.length}
            </span>
          ) : null}
        </div>

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

        <div className="scout-review-layout">
          <div className="scout-review-reading">
            <div className="record-page-grid">
              <section className="record-context-card scout-assessment-card">
                <p className="utility-label">Assessment</p>

                {item.assessment ? (
                  <>
                    <h2
                      className={`scout-gate-headline ${item.assessment.gate}`}
                    >
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
                              <strong>
                                {evidenceFieldLabels[conflict.field]}
                              </strong>
                              <span>{conflict.values.join('  /  ')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <p className="scout-rubric-note">
                      Rubric {item.assessment.rubricVersion}, calculated{' '}
                      {formatDate(item.assessment.calculatedAt)}. Bands rank
                      review work. There is no total, and none of this is a
                      partnership decision.
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
              <p className="utility-label">Evidence by review question</p>

              {item.evidence.length === 0 ? (
                <p className="record-empty">
                  Nothing was stored about this candidate. A quarantined subject
                  looked like a natural person, and the pipeline discards rather
                  than files those.
                </p>
              ) : (
                <div className="scout-evidence-groups">
                  {evidenceGroups.map((group) => {
                    const evidence = item.evidence.filter((entry) =>
                      group.fields.some((field) => field === entry.field)
                    )
                    return (
                      <section key={group.title}>
                        <div className="scout-evidence-group-head">
                          <h2>{group.title}</h2>
                          <span>{evidence.length} items</span>
                        </div>
                        {evidence.length > 0 ? (
                          <ul className="scout-evidence-list">
                            {evidence.map((entry) => (
                              <li key={entry.id}>
                                <div className="scout-evidence-head">
                                  <strong>
                                    {evidenceFieldLabels[entry.field]}
                                  </strong>
                                  <span>{entry.value}</span>
                                </div>
                                <blockquote>{entry.excerpt}</blockquote>
                                <div className="scout-evidence-meta">
                                  <a
                                    className="cursor-pointer"
                                    href={entry.sourceUrl}
                                    rel="noreferrer noopener"
                                    target="_blank"
                                    onClick={() =>
                                      recordScoutUiEvent({
                                        eventType: 'source_opened',
                                        candidateId,
                                        metadata: { field: entry.field },
                                      })
                                    }
                                  >
                                    {entry.sourceTitle ?? entry.sourceUrl}
                                  </a>
                                  <span>
                                    Observed {formatDate(entry.observedAt)}
                                  </span>
                                  <span>{evidenceStatus(entry)}</span>
                                </div>
                                <details>
                                  <summary className="cursor-pointer">
                                    Technical details
                                  </summary>
                                  <p>
                                    {entry.extractionMethod} ·{' '}
                                    {entry.extractorVersion} · {entry.certainty}
                                  </p>
                                </details>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="scout-evidence-empty">
                            No evidence has been recorded for this question.
                          </p>
                        )}
                      </section>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="record-panel scout-review-panel">
            <p className="utility-label">Decision</p>

            {item.evidenceRequests
              .filter((request) => request.status === 'open')
              .map((request) => (
                <div className="scout-open-request" key={request.id}>
                  <strong>Open evidence request</strong>
                  <p>{request.note}</p>
                  <span>
                    {request.fields
                      .map((field) => evidenceFieldLabels[field])
                      .join(', ')}
                  </span>
                </div>
              ))}

            {decidable ? (
              <>
                <p className="scout-review-note">
                  A decision records review work only. It creates no CRM
                  organisation, person, case, or task.
                </p>

                <label className="scout-reason-field">
                  <span>Reason type</span>
                  <select
                    value={reasonCategory}
                    onChange={(event) => setReasonCategory(event.target.value)}
                  >
                    <option value="">Select a reason type</option>
                    {scoutReasonCategories.map((category) => (
                      <option key={category} value={category}>
                        {reasonCategoryLabels[category]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="scout-reason-field">
                  <span>Reason</span>
                  <textarea
                    placeholder="What evidence supports this decision?"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>

                <fieldset className="scout-missing-fields">
                  <legend>Missing evidence, when requesting more</legend>
                  {scoutEvidenceFields.map((field) => (
                    <label key={field}>
                      <input
                        checked={evidenceFields.includes(field)}
                        type="checkbox"
                        onChange={() => toggleEvidenceField(field)}
                      />
                      <span>{evidenceFieldLabels[field]}</span>
                    </label>
                  ))}
                </fieldset>

                <div className="scout-review-actions">
                  {scoutReviewDecisions.map((decision) => {
                    const disabled =
                      !commonDecisionReady ||
                      (decision === 'accept' && !canAccept) ||
                      (decision === 'needs_evidence' &&
                        evidenceFields.length === 0)
                    return (
                      <button
                        aria-keyshortcuts={decisionShortcuts[decision]}
                        className="cursor-pointer"
                        disabled={disabled}
                        key={decision}
                        type="button"
                        onClick={() => decide(decision)}
                      >
                        {decisionLabels[decision]}
                      </button>
                    )
                  })}
                </div>

                {!canAccept ? (
                  <p className="scout-decision-help">
                    Accept becomes available when the evidence gate is ready.
                  </p>
                ) : null}
                <p className="scout-decision-help">
                  Shortcuts: Alt+A accept, Alt+W watch, Alt+R reject, Alt+E
                  request evidence.
                </p>

                <label className="scout-continue-next">
                  <input
                    checked={continueToNext}
                    type="checkbox"
                    onChange={(event) =>
                      setContinueToNext(event.target.checked)
                    }
                  />
                  <span>Continue to the next candidate after deciding</span>
                </label>

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
                    {entry.reasonCategory ? (
                      <small>
                        {reasonCategoryLabels[entry.reasonCategory]}
                      </small>
                    ) : null}
                    <p>{entry.reason}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        </div>
      </article>
    </CrmShell>
  )
}
