'use client'

import type { ScoutCandidateSummary } from '@/contracts/scout'

import { bandLabels, dimensionLabels, gateLabels } from './scout-labels'

interface ScoutComparePanelProps {
  candidates: ScoutCandidateSummary[]
  onClose: () => void
}

export function ScoutComparePanel({
  candidates,
  onClose,
}: ScoutComparePanelProps) {
  return (
    <section
      aria-labelledby="compare-title"
      className="scout-compare-panel"
      role="dialog"
    >
      <div className="scout-compare-head">
        <div>
          <p className="utility-label">Comparison</p>
          <h2 id="compare-title">Review the evidence side by side</h2>
        </div>
        <button
          className="scout-secondary-action cursor-pointer"
          type="button"
          onClick={onClose}
        >
          Close comparison
        </button>
      </div>

      <div
        className="scout-compare-grid"
        style={{ '--compare-count': candidates.length } as React.CSSProperties}
      >
        {candidates.map((candidate) => (
          <article key={candidate.id}>
            <h3>{candidate.displayName}</h3>
            <p className="scout-compare-domain">
              {candidate.domain ?? 'No canonical domain'}
            </p>
            <p>{candidate.summary ?? 'No published summary.'}</p>
            <dl>
              <div>
                <dt>Evidence readiness</dt>
                <dd>
                  {candidate.assessment
                    ? gateLabels[candidate.assessment.gate]
                    : 'Not assessed'}
                </dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>
                  {candidate.evidenceCount} items ·{' '}
                  {candidate.assessment?.distinctSources ?? 0} sources
                </dd>
              </div>
              <div>
                <dt>Last observed</dt>
                <dd>
                  {new Date(candidate.lastObservedAt).toLocaleDateString(
                    'en-GB'
                  )}
                </dd>
              </div>
            </dl>
            <ul>
              {candidate.assessment?.dimensions.map((dimension) => (
                <li key={dimension.dimension}>
                  <span>{dimensionLabels[dimension.dimension]}</span>
                  <strong>{bandLabels[dimension.band]}</strong>
                  <small>{dimension.reason}</small>
                </li>
              )) ?? <li>No assessment is available.</li>}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
