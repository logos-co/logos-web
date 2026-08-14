'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import type { SearchHit, SearchResult } from '@/contracts/search'
import { SEARCH_MIN_LENGTH } from '@/contracts/search'
import { apiClient } from '@/lib/api-client'

import { CrmShell } from './crm-shell'

function SearchGroup({ hits, title }: { hits: SearchHit[]; title: string }) {
  if (hits.length === 0) return null

  return (
    <section className="report-card">
      <p className="utility-label">{title}</p>
      <ul className="search-hits">
        {hits.map((hit) => (
          <li key={hit.id}>
            <Link className="search-hit cursor-pointer" href={hit.href}>
              <strong>{hit.title}</strong>
              {hit.subtitle && <span>{hit.subtitle}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SearchView() {
  const params = useSearchParams()
  const term = (params.get('q') ?? '').trim()
  const isSearchable = term.length >= SEARCH_MIN_LENGTH

  const searchQuery = useQuery({
    queryKey: ['search', term],
    queryFn: () =>
      apiClient<{ item: SearchResult }>(
        `/api/v1/search?q=${encodeURIComponent(term)}`
      ),
    enabled: isSearchable,
  })

  const result = searchQuery.data?.item

  return (
    <CrmShell view="search">
      <header className="workspace-header">
        <h1>Search</h1>
      </header>

      {!isSearchable && (
        <p className="record-empty">
          Type at least {SEARCH_MIN_LENGTH} characters to search cases, people,
          and organisations.
        </p>
      )}

      {isSearchable && (
        <p className="report-contract">
          Results for “{term}”{result ? ` · ${result.total} found` : ''}
        </p>
      )}

      {searchQuery.isLoading && <p className="record-empty">Searching…</p>}
      {searchQuery.isError && (
        <p className="record-empty">The search could not be completed.</p>
      )}

      {result && result.total === 0 && (
        <p className="record-empty">Nothing matches “{term}”.</p>
      )}

      {result && result.total > 0 && (
        <div className="report-grid">
          <SearchGroup hits={result.cases} title="Cases" />
          <SearchGroup hits={result.people} title="People" />
          <SearchGroup hits={result.organisations} title="Organisations" />
        </div>
      )}
    </CrmShell>
  )
}
