'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import type {
  BulkScoutReviewInput,
  ScoutCandidateSummary,
  ScoutDiscoveryRun,
} from '@/contracts/scout'
import { scoutReviewStates } from '@/contracts/values'
import { ApiClientError, apiClient } from '@/lib/api-client'

import { CrmShell } from './crm-shell'
import {
  bandLabels,
  decisionLabels,
  dimensionLabels,
  entityTypeLabels,
  gateLabels,
  reviewStateLabels,
} from './scout-labels'

interface CandidateListResponse {
  items: ScoutCandidateSummary[]
}

interface DiscoveryResponse {
  item: { run: ScoutDiscoveryRun; discovered: string[] }
}

type StateFilter = 'all' | (typeof scoutReviewStates)[number]

const stateFilters: StateFilter[] = ['all', ...scoutReviewStates]

/** Accepting is a per-candidate judgement, so it is not offered in bulk. */
const bulkDecisions = ['watch', 'reject', 'needs_evidence'] as const

const SEARCH_MIN_LENGTH = 2

function GateBadge({ candidate }: { candidate: ScoutCandidateSummary }) {
  if (candidate.reviewState === 'quarantined') {
    return <span className="scout-gate quarantined">Quarantined</span>
  }

  if (!candidate.assessment) {
    return <span className="scout-gate insufficient">Not assessed</span>
  }

  return (
    <span className={`scout-gate ${candidate.assessment.gate}`}>
      {gateLabels[candidate.assessment.gate]}
    </span>
  )
}

export function ScoutInbox() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<StateFilter>('all')
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (state !== 'all') params.set('state', state)
    if (term.trim().length >= SEARCH_MIN_LENGTH) params.set('q', term.trim())
    return params.toString()
  }, [state, term])

  const candidatesQuery = useQuery({
    queryKey: ['scout-candidates', query],
    queryFn: () =>
      apiClient<CandidateListResponse>(
        query
          ? `/api/v1/scout/candidates?${query}`
          : '/api/v1/scout/candidates'
      ),
  })

  async function refresh(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ['scout-candidates'] })
    await queryClient.invalidateQueries({ queryKey: ['scout-runs'] })
  }

  const runsQuery = useQuery({
    queryKey: ['scout-runs'],
    queryFn: () => apiClient<{ items: ScoutDiscoveryRun[] }>(
      '/api/v1/scout/discovery-runs'
    ),
  })

  const discover = useMutation({
    mutationFn: () =>
      apiClient<DiscoveryResponse>('/api/v1/scout/discovery-runs', {
        method: 'POST',
      }),
    onSuccess: async (response) => {
      setError(null)
      setNotice(response.item.run.note)
      await refresh()
    },
    onError: () => setError('The discovery run could not be started.'),
  })

  const decide = useMutation({
    mutationFn: (input: BulkScoutReviewInput) =>
      apiClient<{ item: { decided: number } }>('/api/v1/scout/reviews', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async (response) => {
      setError(null)
      setNotice(
        `${response.item.decided} ${
          response.item.decided === 1 ? 'candidate' : 'candidates'
        } decided.`
      )
      setSelected([])
      setReason('')
      await refresh()
    },
    onError: (cause: unknown) => {
      setError(
        cause instanceof ApiClientError
          ? cause.message
          : 'The decisions could not be recorded.'
      )
    },
  })

  const items = candidatesQuery.data?.items ?? []
  const selectable = items.filter(
    (item) =>
      item.reviewState !== 'quarantined' && item.reviewState !== 'accepted'
  )
  const lastRun = runsQuery.data?.items[0] ?? null

  function toggle(candidateId: string): void {
    setSelected((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId]
    )
  }

  const allSelected =
    selectable.length > 0 && selected.length === selectable.length

  return (
    <CrmShell view="scout">
      <header className="workspace-header">
        <h1>Scout</h1>
        <button
          className="scout-discover cursor-pointer"
          disabled={discover.isPending}
          type="button"
          onClick={() => discover.mutate()}
        >
          {discover.isPending ? 'Looking' : 'Find more'}
        </button>
      </header>

      <p className="scout-preamble">
        Organisations and projects that may be relevant to Logos, with the
        public evidence that surfaced them. Nothing here is a CRM record:
        deciding on a candidate records your decision and creates nothing.
      </p>

      {notice ? (
        <p aria-live="polite" className="scout-notice">
          {notice}
        </p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}

      <nav className="queue-tabs" aria-label="Candidate states">
        {stateFilters.map((value) => (
          <button
            aria-pressed={state === value}
            className={`queue-tab cursor-pointer ${state === value ? 'selected' : ''}`}
            key={value}
            type="button"
            onClick={() => setState(value)}
          >
            <span>{value === 'all' ? 'All' : reviewStateLabels[value]}</span>
          </button>
        ))}
      </nav>

      <section className="case-workspace list-workspace">
        <div className="section-header">
          <div className="section-title-group">
            <h2>Candidates</h2>
            <span className="result-count" aria-live="polite">
              {items.length} {items.length === 1 ? 'candidate' : 'candidates'}
            </span>
          </div>
          <div className="table-controls">
            <label className="search-field">
              <span>Search</span>
              <input
                placeholder="Name, domain, or summary"
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
              />
            </label>
          </div>
        </div>

        {lastRun ? (
          <p className="scout-run-note">
            Last run {new Date(lastRun.startedAt).toLocaleDateString('en-GB')}:{' '}
            {lastRun.note}
          </p>
        ) : null}

        {selectable.length > 0 ? (
          <div className="scout-select-bar">
            <label className="scout-select-all">
              <input
                checked={allSelected}
                type="checkbox"
                onChange={() =>
                  setSelected(
                    allSelected ? [] : selectable.map((item) => item.id)
                  )
                }
              />
              <span>
                {selected.length > 0
                  ? `${selected.length} selected`
                  : 'Select all decidable'}
              </span>
            </label>

            {selected.length > 0 ? (
              <div className="scout-bulk-actions">
                <input
                  aria-label="Reason for these decisions"
                  placeholder="One reason for all of them"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                {bulkDecisions.map((decision) => (
                  <button
                    className="cursor-pointer"
                    disabled={reason.trim().length < 3 || decide.isPending}
                    key={decision}
                    type="button"
                    onClick={() =>
                      decide.mutate({
                        candidateIds: selected,
                        decision,
                        reason: reason.trim(),
                      })
                    }
                  >
                    {decisionLabels[decision]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {candidatesQuery.isPending ? (
          <p className="table-message">Loading candidates.</p>
        ) : items.length === 0 ? (
          <p className="table-message">
            {term.trim().length >= SEARCH_MIN_LENGTH
              ? 'No candidate matches that search.'
              : 'No candidates in this state. Use "Find more" to run synthetic discovery.'}
          </p>
        ) : (
          <ul className="scout-list">
            {items.map((candidate) => {
              const decidable =
                candidate.reviewState !== 'quarantined' &&
                candidate.reviewState !== 'accepted'

              return (
                <li className="scout-list-item" key={candidate.id}>
                  <div className="scout-list-row">
                    {decidable ? (
                      <label className="scout-select">
                        <input
                          checked={selected.includes(candidate.id)}
                          type="checkbox"
                          onChange={() => toggle(candidate.id)}
                        />
                        <span className="visually-hidden">
                          Select {candidate.displayName}
                        </span>
                      </label>
                    ) : (
                      <span className="scout-select-placeholder" />
                    )}

                    <Link
                      className="scout-list-link cursor-pointer"
                      href={`/scout/${candidate.id}`}
                    >
                      <div className="scout-list-identity">
                        <strong>{candidate.displayName}</strong>
                        <small>
                          {entityTypeLabels[candidate.entityType]}
                          {candidate.domain ? ` · ${candidate.domain}` : ''}
                        </small>
                      </div>

                      <p className="scout-list-summary">
                        {candidate.summary ??
                          'Nothing was extracted about this candidate.'}
                      </p>

                      <div className="scout-list-meta">
                        <GateBadge candidate={candidate} />
                        <span className="scout-state">
                          {reviewStateLabels[candidate.reviewState]}
                        </span>
                        <span className="scout-evidence-count">
                          {candidate.evidenceCount} evidence
                        </span>
                      </div>
                    </Link>
                  </div>

                  {candidate.assessment ? (
                    <ul className="scout-band-row">
                      {candidate.assessment.dimensions.map((result) => (
                        <li
                          className={`scout-band ${result.band}`}
                          key={result.dimension}
                        >
                          <span>{dimensionLabels[result.dimension]}</span>
                          <b>{bandLabels[result.band]}</b>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </CrmShell>
  )
}
