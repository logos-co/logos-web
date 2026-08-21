'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type {
  CreateScoutDiscoveryBriefInput,
  ScoutDiscoveryBrief,
  ScoutDiscoveryRun,
} from '@/contracts/scout'
import { apiClient } from '@/lib/api-client'

interface BriefsResponse {
  items: ScoutDiscoveryBrief[]
}

interface ScoutDiscoveryPanelProps {
  isRunning: boolean
  recentRuns: ScoutDiscoveryRun[]
  sourcesEnabled: boolean
  onRun: (input: { briefId?: string; mode: 'synthetic' | 'sources' }) => void
}

const DISCOVERY_PURPOSE =
  'Find organisations for partnership and ecosystem qualification.'

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function briefName(query: string): string {
  const firstSentence = query.trim().split(/[.!?]/)[0]?.trim() ?? query.trim()
  return firstSentence.slice(0, 72)
}

export function ScoutDiscoveryPanel({
  isRunning,
  recentRuns,
  sourcesEnabled,
  onRun,
}: ScoutDiscoveryPanelProps) {
  const queryClient = useQueryClient()
  const [selectedBriefId, setSelectedBriefId] = useState('')
  const [query, setQuery] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [activeWithinMonths, setActiveWithinMonths] = useState('12')
  const [useApprovedSources, setUseApprovedSources] = useState(false)

  const briefsQuery = useQuery({
    queryKey: ['scout-briefs'],
    queryFn: () => apiClient<BriefsResponse>('/api/v1/scout/discovery-briefs'),
  })

  const mode = sourcesEnabled && useApprovedSources ? 'sources' : 'synthetic'

  const saveBrief = useMutation({
    mutationFn: (input: CreateScoutDiscoveryBriefInput) =>
      apiClient<{ item: ScoutDiscoveryBrief }>(
        '/api/v1/scout/discovery-briefs',
        { method: 'POST', body: JSON.stringify(input) }
      ),
    onSuccess: async ({ item }) => {
      setSelectedBriefId(item.id)
      await queryClient.invalidateQueries({ queryKey: ['scout-briefs'] })
      onRun({ briefId: item.id, mode })
    },
  })

  function findOrganisations(): void {
    const target = query.trim()
    saveBrief.mutate({
      name: briefName(target),
      purpose: DISCOVERY_PURPOSE,
      query: target,
      organisationTypes: [],
      themes: [],
      exclusions: splitList(exclusions),
      regions: [],
      activeWithinMonths: Number(activeWithinMonths),
      sourceTypes: [],
    })
  }

  return (
    <section
      className="scout-discovery-panel"
      aria-labelledby="discovery-title"
    >
      <div className="scout-target-intro">
        <p className="utility-label">Find organisations</p>
        <h2 id="discovery-title">Who should Scout look for?</h2>
        <p>
          Describe the organisations, projects, or communities you want to
          review. Scout will keep the public evidence that explains every
          result.
        </p>
      </div>

      <div className="scout-target-composer">
        <label className="scout-target-query">
          <span>Target description</span>
          <textarea
            placeholder="Privacy and networking organisations with active open-source work"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <details className="scout-target-advanced">
          <summary className="cursor-pointer">Refine this search</summary>
          <div>
            <label>
              <span>Published activity</span>
              <select
                value={activeWithinMonths}
                onChange={(event) => setActiveWithinMonths(event.target.value)}
              >
                <option value="3">Within 3 months</option>
                <option value="6">Within 6 months</option>
                <option value="12">Within 12 months</option>
                <option value="24">Within 24 months</option>
              </select>
            </label>
            <label>
              <span>Exclude</span>
              <input
                placeholder="Audience analytics, personal repositories"
                value={exclusions}
                onChange={(event) => setExclusions(event.target.value)}
              />
              <small>Separate several exclusions with commas.</small>
            </label>
            {sourcesEnabled ? (
              <label className="scout-source-choice">
                <span>Evidence source</span>
                <span>
                  <input
                    checked={useApprovedSources}
                    type="checkbox"
                    onChange={(event) =>
                      setUseApprovedSources(event.target.checked)
                    }
                  />
                  Search approved public sources
                </span>
                <small>
                  Leave this off to preview the workflow with invented demo
                  organisations.
                </small>
              </label>
            ) : null}
          </div>
        </details>

        <div className="scout-target-action">
          <p>
            {mode === 'sources'
              ? 'Scout will search approved public sources.'
              : 'This run uses invented demo organisations and makes no external requests.'}
          </p>
          <button
            className="scout-primary-action cursor-pointer"
            disabled={
              query.trim().length < 2 || saveBrief.isPending || isRunning
            }
            type="button"
            onClick={findOrganisations}
          >
            {saveBrief.isPending || isRunning
              ? 'Finding organisations'
              : 'Find organisations'}
          </button>
        </div>

        {query.trim().length > 0 && query.trim().length < 2 ? (
          <p className="scout-field-help">Enter at least two characters.</p>
        ) : null}
        {saveBrief.isError ? (
          <p className="form-error">
            The target could not be saved. Check the fields and try again.
          </p>
        ) : null}
      </div>

      <div className="scout-discovery-secondary">
        <details>
          <summary className="cursor-pointer">
            Use a saved search
            <span>{briefsQuery.data?.items.length ?? 0}</span>
          </summary>
          <div className="scout-saved-search">
            <label>
              <span>Saved search</span>
              <select
                value={selectedBriefId}
                onChange={(event) => setSelectedBriefId(event.target.value)}
              >
                <option value="">Choose a saved search</option>
                {(briefsQuery.data?.items ?? []).map((brief) => (
                  <option key={brief.id} value={brief.id}>
                    {brief.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="scout-secondary-action cursor-pointer"
              disabled={!selectedBriefId || isRunning}
              type="button"
              onClick={() => onRun({ briefId: selectedBriefId, mode })}
            >
              Run saved search
            </button>
          </div>
        </details>

        {recentRuns.length > 0 ? (
          <details>
            <summary className="cursor-pointer">
              Recent searches
              <span>{recentRuns.length}</span>
            </summary>
            <div className="scout-run-history-grid">
              {recentRuns.map((run) => (
                <article key={run.id}>
                  <strong>
                    {new Date(run.startedAt).toLocaleDateString('en-GB')}
                  </strong>
                  <span>{run.sourcesUsed.join(', ') || run.mode}</span>
                  <p>{run.note}</p>
                </article>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  )
}
