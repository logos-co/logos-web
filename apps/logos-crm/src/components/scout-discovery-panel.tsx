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
  lastRun: ScoutDiscoveryRun | null
  sourcesEnabled: boolean
  onRun: (input: { briefId?: string; mode: 'synthetic' | 'sources' }) => void
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function ScoutDiscoveryPanel({
  isRunning,
  lastRun,
  sourcesEnabled,
  onRun,
}: ScoutDiscoveryPanelProps) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [selectedBriefId, setSelectedBriefId] = useState('')
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [query, setQuery] = useState('')
  const [organisationTypes, setOrganisationTypes] = useState('')
  const [themes, setThemes] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [regions, setRegions] = useState('')
  const [activeWithinMonths, setActiveWithinMonths] = useState('12')
  const [sourceTypes, setSourceTypes] = useState('GitHub')
  const [mode, setMode] = useState<'synthetic' | 'sources'>('synthetic')

  const briefsQuery = useQuery({
    queryKey: ['scout-briefs'],
    queryFn: () => apiClient<BriefsResponse>('/api/v1/scout/discovery-briefs'),
  })

  const saveBrief = useMutation({
    mutationFn: (input: CreateScoutDiscoveryBriefInput) =>
      apiClient<{ item: ScoutDiscoveryBrief }>(
        '/api/v1/scout/discovery-briefs',
        { method: 'POST', body: JSON.stringify(input) }
      ),
    onSuccess: async ({ item }) => {
      setSelectedBriefId(item.id)
      await queryClient.invalidateQueries({ queryKey: ['scout-briefs'] })
      onRun({
        briefId: item.id,
        mode,
      })
    },
  })

  const canSave =
    name.trim().length >= 3 &&
    purpose.trim().length >= 3 &&
    query.trim().length >= 2

  function submitBrief(): void {
    saveBrief.mutate({
      name: name.trim(),
      purpose: purpose.trim(),
      query: query.trim(),
      organisationTypes: splitList(organisationTypes),
      themes: splitList(themes),
      exclusions: splitList(exclusions),
      regions: splitList(regions),
      activeWithinMonths: activeWithinMonths
        ? Number(activeWithinMonths)
        : null,
      sourceTypes: splitList(sourceTypes),
    })
  }

  return (
    <section
      className="scout-discovery-panel"
      aria-labelledby="discovery-title"
    >
      <div className="scout-discovery-head">
        <div>
          <p className="utility-label">Discovery</p>
          <h2 id="discovery-title">Run a defined search</h2>
          <p>
            A brief records why the search exists and what belongs in its
            results. It never expands an approved source policy.
          </p>
        </div>
        <button
          aria-expanded={expanded}
          className="scout-secondary-action cursor-pointer"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Close' : 'New discovery run'}
        </button>
      </div>

      {lastRun ? (
        <p className="scout-run-note">
          Last run {new Date(lastRun.startedAt).toLocaleDateString('en-GB')}:{' '}
          {lastRun.note}
        </p>
      ) : null}

      {expanded ? (
        <div className="scout-discovery-body">
          <div className="scout-saved-briefs">
            <label>
              <span>Saved brief</span>
              <select
                value={selectedBriefId}
                onChange={(event) => setSelectedBriefId(event.target.value)}
              >
                <option value="">Select a brief</option>
                {(briefsQuery.data?.items ?? []).map((brief) => (
                  <option key={brief.id} value={brief.id}>
                    {brief.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="scout-run-mode">
              <span>Run mode</span>
              <select
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as 'synthetic' | 'sources')
                }
              >
                <option value="synthetic">Synthetic catalogue</option>
                <option disabled={!sourcesEnabled} value="sources">
                  Approved sources
                </option>
              </select>
            </label>
            <button
              className="scout-primary-action cursor-pointer"
              disabled={!selectedBriefId || isRunning}
              type="button"
              onClick={() =>
                onRun({
                  briefId: selectedBriefId,
                  mode,
                })
              }
            >
              {isRunning ? 'Running discovery' : 'Run selected brief'}
            </button>
          </div>

          <div className="scout-brief-form">
            <label>
              <span>Brief name</span>
              <input
                placeholder="Open networking organisations"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="scout-brief-wide">
              <span>Purpose</span>
              <input
                placeholder="Find organisations for a partnership review"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
              />
            </label>
            <label className="scout-brief-wide">
              <span>Search query</span>
              <input
                placeholder="Censorship-resistant networking"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <span>Organisation types</span>
              <input
                placeholder="Open-source project, foundation"
                value={organisationTypes}
                onChange={(event) => setOrganisationTypes(event.target.value)}
              />
            </label>
            <label>
              <span>Themes</span>
              <input
                placeholder="Networking, privacy"
                value={themes}
                onChange={(event) => setThemes(event.target.value)}
              />
            </label>
            <label>
              <span>Exclude</span>
              <input
                placeholder="Personal repositories"
                value={exclusions}
                onChange={(event) => setExclusions(event.target.value)}
              />
            </label>
            <label>
              <span>Regions</span>
              <input
                placeholder="Global, Europe"
                value={regions}
                onChange={(event) => setRegions(event.target.value)}
              />
            </label>
            <label>
              <span>Active within months</span>
              <input
                min="1"
                max="120"
                type="number"
                value={activeWithinMonths}
                onChange={(event) => setActiveWithinMonths(event.target.value)}
              />
            </label>
            <label>
              <span>Source types</span>
              <input
                placeholder="GitHub, Wikipedia"
                value={sourceTypes}
                onChange={(event) => setSourceTypes(event.target.value)}
              />
            </label>
          </div>

          <div className="scout-discovery-footer">
            <p>
              {sourcesEnabled
                ? mode === 'sources'
                  ? 'This run will contact the approved sources named by their active policies.'
                  : 'This run will use the synthetic catalogue. No external source will be contacted.'
                : 'This deployment will use the synthetic catalogue. No external source will be contacted.'}
            </p>
            <button
              className="scout-primary-action cursor-pointer"
              disabled={!canSave || saveBrief.isPending || isRunning}
              type="button"
              onClick={submitBrief}
            >
              {saveBrief.isPending ? 'Saving brief' : 'Save and run brief'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
