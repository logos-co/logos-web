'use client'

import { Button } from '@acid-info/logos-ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDeferredValue, useMemo, useState } from 'react'

import type {
  CreateOrganisationInput,
  CreatePersonInput,
  OrganisationRecord,
  PersonRecord,
} from '@/contracts/directory'
import { apiClient } from '@/lib/api-client'

import { NewOrganisationDialog } from './new-organisation-dialog'
import { NewPersonDialog } from './new-person-dialog'
import { RecordRow } from './record-row'

interface DirectoryResponse<T> {
  items: T[]
}

interface DirectoryViewProps {
  isLoading: boolean
  mode: 'people' | 'organisations'
  onFeedback: (message: string) => void
  organisations: OrganisationRecord[]
  people: PersonRecord[]
}

const directoryCopy = {
  people: {
    title: 'People',
    button: 'Add person',
    search: 'Name, role, or organisation',
  },
  organisations: {
    title: 'Organisations',
    button: 'Add organisation',
    search: 'Name or domain',
  },
} as const

export function DirectoryView({
  isLoading,
  mode,
  onFeedback,
  organisations,
  people,
}: DirectoryViewProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [isDialogOpen, setDialogOpen] = useState(false)
  const copy = directoryCopy[mode]

  const filteredQuery = useQuery({
    queryKey: [mode, 'search', deferredSearch],
    queryFn: () =>
      apiClient<DirectoryResponse<PersonRecord | OrganisationRecord>>(
        `/api/v1/${mode}?q=${encodeURIComponent(deferredSearch)}`
      ),
    enabled: deferredSearch.length > 0,
    placeholderData: (previous) => previous,
  })

  const sourceItems = mode === 'people' ? people : organisations
  const items = deferredSearch ? (filteredQuery.data?.items ?? []) : sourceItems

  const createOrganisationMutation = useMutation({
    mutationFn: (input: CreateOrganisationInput) =>
      apiClient<{ item: OrganisationRecord }>('/api/v1/organisations', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async ({ item }) => {
      setDialogOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['organisations'] })
      router.push(`/organisations/${item.id}`)
    },
    onError: () => onFeedback('The organisation could not be created. Retry.'),
  })

  const createPersonMutation = useMutation({
    mutationFn: (input: CreatePersonInput) =>
      apiClient<{ item: PersonRecord }>('/api/v1/people', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async ({ item }) => {
      setDialogOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['people'] }),
        queryClient.invalidateQueries({ queryKey: ['organisations'] }),
      ])
      router.push(`/people/${item.id}`)
    },
    onError: () => onFeedback('The person could not be created. Retry.'),
  })

  const linkedCaseCount = useMemo(
    () => sourceItems.reduce((sum, item) => sum + item.linkedCaseCount, 0),
    [sourceItems]
  )

  return (
    <>
      <header className="workspace-header directory-heading">
        <h1>{copy.title}</h1>
        <Button className="cursor-pointer" onClick={() => setDialogOpen(true)}>
          {copy.button}
        </Button>
      </header>

      <section className="directory-index" aria-label="Directory index">
        <DirectoryMetric
          label="People"
          value={people.length}
          active={mode === 'people'}
        />
        <DirectoryMetric
          label="Organisations"
          value={organisations.length}
          active={mode === 'organisations'}
        />
        <DirectoryMetric label="Case links" value={linkedCaseCount} />
      </section>

      <section className="case-workspace list-workspace">
        <div className="section-header">
          <div className="section-title-group">
            <h2>{mode === 'people' ? 'All people' : 'All organisations'}</h2>
            <span className="result-count" aria-live="polite">
              {items.length}{' '}
              {mode === 'people'
                ? items.length === 1
                  ? 'person'
                  : 'people'
                : items.length === 1
                  ? 'organisation'
                  : 'organisations'}
            </span>
          </div>
          <div className="table-controls">
            <label className="search-field">
              <span>Search</span>
              <input
                type="search"
                value={search}
                placeholder={copy.search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {search && (
              <button
                className="table-text-action cursor-pointer"
                type="button"
                onClick={() => setSearch('')}
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap directory-table-wrap">
          {mode === 'people' ? (
            <PeopleTable
              isFetching={isLoading || filteredQuery.isFetching}
              items={items as PersonRecord[]}
            />
          ) : (
            <OrganisationsTable
              isFetching={isLoading || filteredQuery.isFetching}
              items={items as OrganisationRecord[]}
            />
          )}
          {(isLoading || filteredQuery.isLoading) && (
            <div className="table-message">Loading the directory…</div>
          )}
          {filteredQuery.isError && (
            <div className="table-message">
              <p>The directory search could not be completed.</p>
              <button
                className="table-state-action cursor-pointer"
                type="button"
                onClick={() => filteredQuery.refetch()}
              >
                Retry
              </button>
            </div>
          )}
          {!isLoading &&
            !filteredQuery.isLoading &&
            !filteredQuery.isError &&
            items.length === 0 && (
              <div className="table-message">
                <p>No records match this search.</p>
                {search && (
                  <button
                    className="table-state-action cursor-pointer"
                    type="button"
                    onClick={() => setSearch('')}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
        </div>
      </section>

      {isDialogOpen && mode === 'people' && (
        <NewPersonDialog
          isSaving={createPersonMutation.isPending}
          organisations={organisations}
          onClose={() => setDialogOpen(false)}
          onCreate={(input) =>
            createPersonMutation.mutateAsync(input).then(() => undefined)
          }
        />
      )}
      {isDialogOpen && mode === 'organisations' && (
        <NewOrganisationDialog
          isSaving={createOrganisationMutation.isPending}
          onClose={() => setDialogOpen(false)}
          onCreate={(input) =>
            createOrganisationMutation.mutateAsync(input).then(() => undefined)
          }
        />
      )}
    </>
  )
}

function DirectoryMetric({
  active = false,
  label,
  value,
}: {
  active?: boolean
  label: string
  value: number
}) {
  return (
    <div className={active ? 'active' : ''}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PeopleTable({
  isFetching,
  items,
}: {
  isFetching: boolean
  items: PersonRecord[]
}) {
  return (
    <table aria-busy={isFetching}>
      <caption className="visually-hidden">
        People. Select any row to open its detail page.
      </caption>
      <thead>
        <tr>
          <th>Person</th>
          <th>Organisation</th>
          <th>Contact</th>
          <th>Cases</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <RecordRow href={`/people/${item.id}`} key={item.id}>
            <td data-label="Person">
              <Link
                aria-label={`Open person ${item.fullName}`}
                className="case-link cursor-pointer"
                href={`/people/${item.id}`}
              >
                <span>{item.fullName}</span>
                <small>{item.roleTitle ?? 'No role recorded'}</small>
              </Link>
            </td>
            <td data-label="Organisation">
              {item.organisationName ?? 'Independent'}
            </td>
            <td data-label="Contact">
              {item.email ?? item.phone ?? 'No contact method'}
            </td>
            <td data-label="Cases">{item.linkedCaseCount}</td>
          </RecordRow>
        ))}
      </tbody>
    </table>
  )
}

function OrganisationsTable({
  isFetching,
  items,
}: {
  isFetching: boolean
  items: OrganisationRecord[]
}) {
  return (
    <table aria-busy={isFetching}>
      <caption className="visually-hidden">
        Organisations. Select any row to open its detail page.
      </caption>
      <thead>
        <tr>
          <th>Organisation</th>
          <th>Domain</th>
          <th>People</th>
          <th>Cases</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <RecordRow href={`/organisations/${item.id}`} key={item.id}>
            <td data-label="Organisation">
              <Link
                aria-label={`Open organisation ${item.displayName}`}
                className="case-link cursor-pointer"
                href={`/organisations/${item.id}`}
              >
                <span>{item.displayName}</span>
                <small>{item.status}</small>
              </Link>
            </td>
            <td data-label="Domain">{item.domain ?? 'No domain'}</td>
            <td data-label="People">{item.contactCount}</td>
            <td data-label="Cases">{item.linkedCaseCount}</td>
          </RecordRow>
        ))}
      </tbody>
    </table>
  )
}
