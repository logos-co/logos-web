'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'

import type { ScoutCandidateSummary } from '@/contracts/scout'
import { scoutReviewStates } from '@/contracts/values'
import { apiClient } from '@/lib/api-client'

import { CrmShell } from './crm-shell'
import {
  bandLabels,
  dimensionLabels,
  entityTypeLabels,
  gateLabels,
  reviewStateLabels,
} from './scout-labels'

interface CandidateListResponse {
  items: ScoutCandidateSummary[]
}

type StateFilter = 'all' | (typeof scoutReviewStates)[number]

const stateFilters: StateFilter[] = ['all', ...scoutReviewStates]

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
  const [state, setState] = useState<StateFilter>('all')

  const candidatesQuery = useQuery({
    queryKey: ['scout-candidates', state],
    queryFn: () =>
      apiClient<CandidateListResponse>(
        state === 'all'
          ? '/api/v1/scout/candidates'
          : `/api/v1/scout/candidates?state=${state}`
      ),
  })

  const items = candidatesQuery.data?.items ?? []

  return (
    <CrmShell view="scout">
      <header className="workspace-header">
        <h1>Scout</h1>
      </header>

      <p className="scout-preamble">
        Organisations and projects that may be relevant to Logos, with the
        public evidence that surfaced them. Nothing here is a CRM record:
        deciding on a candidate records your decision and creates nothing.
      </p>

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
        </div>

        {candidatesQuery.isPending ? (
          <p className="table-message">Loading candidates.</p>
        ) : items.length === 0 ? (
          <p className="table-message">
            No candidates in this state. Discovery runs against real sources are
            not enabled yet, so this queue only holds synthetic fixtures.
          </p>
        ) : (
          <ul className="scout-list">
            {items.map((candidate) => (
              <li className="scout-list-item" key={candidate.id}>
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

                {candidate.assessment ? (
                  <ul className="scout-band-row">
                    {candidate.assessment.dimensions.map((result) => (
                      <li className={`scout-band ${result.band}`} key={result.dimension}>
                        <span>{dimensionLabels[result.dimension]}</span>
                        <b>{bandLabels[result.band]}</b>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </CrmShell>
  )
}
