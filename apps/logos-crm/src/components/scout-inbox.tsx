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
import { recordScoutUiEvent } from '@/lib/scout-events'

import { CrmShell } from './crm-shell'
import { ScoutComparePanel } from './scout-compare-panel'
import { ScoutDiscoveryPanel } from './scout-discovery-panel'
import {
  decisionLabels,
  entityTypeLabels,
  gateLabels,
  reviewStateLabels,
} from './scout-labels'

interface CandidateListResponse {
  items: ScoutCandidateSummary[]
  stateCounts: Record<(typeof scoutReviewStates)[number], number>
}

interface DiscoveryResponse {
  item: { run: ScoutDiscoveryRun; discovered: string[] }
}

interface DiscoveryRunsResponse {
  items: ScoutDiscoveryRun[]
  sourcesEnabled: boolean
}

type StateFilter = 'all' | (typeof scoutReviewStates)[number]
type ScoutView = 'find' | 'leads' | 'qualification'

const stateFilters: StateFilter[] = [
  'needs_review',
  'needs_evidence',
  'watch',
  'accepted',
  'rejected',
]

/** Qualification is a per-lead judgement, so it is not offered in bulk. */
const bulkDecisions = ['watch', 'reject'] as const

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

function reviewPrompt(candidate: ScoutCandidateSummary): string {
  if (candidate.reviewState === 'quarantined') return 'Privacy quarantine'
  if (!candidate.assessment) return 'Assessment unavailable'
  if (candidate.assessment.gate === 'conflicted') return 'Resolve disagreement'
  if (candidate.assessment.gate === 'sufficient') return 'Ready to qualify'
  return 'Find missing evidence'
}

export function ScoutInbox() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<ScoutView>('find')
  const [state, setState] = useState<StateFilter>('all')
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)

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
        query ? `/api/v1/scout/candidates?${query}` : '/api/v1/scout/candidates'
      ),
  })

  async function refresh(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ['scout-candidates'] })
    await queryClient.invalidateQueries({ queryKey: ['scout-runs'] })
  }

  const runsQuery = useQuery({
    queryKey: ['scout-runs'],
    queryFn: () =>
      apiClient<DiscoveryRunsResponse>('/api/v1/scout/discovery-runs'),
  })

  const discover = useMutation({
    mutationFn: (input: { briefId?: string; mode: 'synthetic' | 'sources' }) =>
      apiClient<DiscoveryResponse>('/api/v1/scout/discovery-runs', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async (response) => {
      setError(null)
      setNotice(response.item.run.note)
      await refresh()
      setState('all')
      setView('leads')
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
  const sourcesEnabled = runsQuery.data?.sourcesEnabled ?? false
  const term_ = term.trim()
  const selectable = items.filter(
    (item) =>
      item.reviewState !== 'quarantined' && item.reviewState !== 'accepted'
  )
  const comparedCandidates = items.filter((item) => selected.includes(item.id))
  const stateCounts = candidatesQuery.data?.stateCounts
  const leadCount =
    (stateCounts?.needs_review ?? 0) +
    (stateCounts?.needs_evidence ?? 0) +
    (stateCounts?.watch ?? 0) +
    (stateCounts?.accepted ?? 0)
  const qualificationCount = stateCounts?.needs_review ?? 0

  function changeView(nextView: ScoutView): void {
    setView(nextView)
    setSelected([])
    setState(nextView === 'qualification' ? 'needs_review' : 'all')
  }

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
        <Link
          className="scout-secondary-action scout-report-link cursor-pointer"
          href="/scout/report"
        >
          Review report
        </Link>
      </header>

      <nav className="scout-workflow" aria-label="Scout workflow">
        <button
          aria-current={view === 'find' ? 'step' : undefined}
          className="cursor-pointer"
          type="button"
          onClick={() => changeView('find')}
        >
          <span>1</span>
          <strong>Find</strong>
          <small>Set a target</small>
        </button>
        <button
          aria-current={view === 'leads' ? 'step' : undefined}
          className="cursor-pointer"
          type="button"
          onClick={() => changeView('leads')}
        >
          <span>2</span>
          <strong>Leads</strong>
          <small>{leadCount} potential</small>
        </button>
        <button
          aria-current={view === 'qualification' ? 'step' : undefined}
          className="cursor-pointer"
          type="button"
          onClick={() => changeView('qualification')}
        >
          <span>3</span>
          <strong>Qualification</strong>
          <small>{qualificationCount} to review</small>
        </button>
      </nav>

      <p className="scout-preamble">
        {view === 'find'
          ? 'Find relevant organisations from approved public evidence.'
          : view === 'leads'
            ? 'Potential organisations and projects surfaced by Scout. Open one to inspect why it was found.'
            : 'Review evidence, record a qualification decision, and keep the reasoning for the next person.'}
      </p>

      {notice ? (
        <p aria-live="polite" className="scout-notice">
          {notice}
        </p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}

      {view === 'find' ? (
        <ScoutDiscoveryPanel
          isRunning={discover.isPending}
          recentRuns={runsQuery.data?.items ?? []}
          sourcesEnabled={sourcesEnabled}
          onRun={(input) => discover.mutate(input)}
        />
      ) : null}

      {view === 'qualification' ? (
        <nav className="queue-tabs" aria-label="Qualification stages">
          {stateFilters.map((value) => (
            <button
              aria-pressed={state === value}
              className={`queue-tab cursor-pointer ${state === value ? 'selected' : ''}`}
              key={value}
              type="button"
              onClick={() => setState(value)}
            >
              <span>{value === 'all' ? 'All' : reviewStateLabels[value]}</span>
              <strong>
                {value === 'all'
                  ? Object.values(
                      candidatesQuery.data?.stateCounts ?? {}
                    ).reduce((total, count) => total + count, 0)
                  : (candidatesQuery.data?.stateCounts[value] ?? 0)}
              </strong>
            </button>
          ))}
        </nav>
      ) : null}

      {view !== 'find' ? (
        <section className="case-workspace list-workspace">
          <div className="section-header">
            <div className="section-title-group">
              <h2>
                {view === 'leads' ? 'Potential leads' : 'Qualification queue'}
              </h2>
              <span className="result-count" aria-live="polite">
                {items.length} {items.length === 1 ? 'candidate' : 'candidates'}
              </span>
            </div>
            <div className="table-controls">
              <label className="search-field">
                <span>Search</span>
                <input
                  aria-label="Search candidates"
                  placeholder="Name, domain, or summary"
                  type="search"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                />
              </label>
            </div>
          </div>

          {view === 'qualification' && selectable.length > 0 ? (
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
                  <button
                    className="cursor-pointer"
                    disabled={selected.length < 2 || selected.length > 3}
                    type="button"
                    onClick={() => {
                      setCompareOpen(true)
                      recordScoutUiEvent({
                        eventType: 'comparison_opened',
                        metadata: { candidateCount: selected.length },
                      })
                    }}
                  >
                    Compare {selected.length >= 2 ? selected.length : ''}
                  </button>
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
              {term_.length >= SEARCH_MIN_LENGTH
                ? 'No candidate matches that filter.'
                : 'No candidates in this state. Run a discovery brief to find some.'}
            </p>
          ) : (
            <>
              <div className="scout-queue-columns" aria-hidden="true">
                <span>Candidate</span>
                <span>Why it is here</span>
                <span>Evidence</span>
                <span>Last observed</span>
              </div>
              <ul className="scout-list">
                {items.map((candidate) => {
                  const decidable =
                    candidate.reviewState !== 'quarantined' &&
                    candidate.reviewState !== 'accepted'

                  return (
                    <li className="scout-list-item" key={candidate.id}>
                      <div className="scout-list-row">
                        {view === 'qualification' && decidable ? (
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
                              (candidate.evidenceCount > 0
                                ? 'No description published; judge it on the evidence.'
                                : 'Nothing was extracted about this candidate.')}
                          </p>

                          <div className="scout-list-prompt">
                            <GateBadge candidate={candidate} />
                            <span>{reviewPrompt(candidate)}</span>
                          </div>
                          <span className="scout-list-evidence">
                            {candidate.evidenceCount} items ·{' '}
                            {candidate.assessment?.distinctSources ?? 0} sources
                          </span>
                          <span className="scout-list-observed">
                            {new Date(
                              candidate.lastObservedAt
                            ).toLocaleDateString('en-GB')}
                          </span>
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      ) : null}

      {compareOpen && comparedCandidates.length >= 2 ? (
        <ScoutComparePanel
          candidates={comparedCandidates.slice(0, 3)}
          onClose={() => setCompareOpen(false)}
        />
      ) : null}
    </CrmShell>
  )
}
