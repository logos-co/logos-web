'use client'

import { Button } from '@acid-info/logos-ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import type {
  CreateOrganisationInput,
  CreatePersonInput,
  OrganisationRecord,
  PersonRecord,
  UpdateOrganisationInput,
  UpdatePersonInput,
} from '@/contracts/directory'
import { apiClient } from '@/lib/api-client'

import { NewOrganisationDialog } from './new-organisation-dialog'
import { NewPersonDialog } from './new-person-dialog'

interface DirectoryResponse<T> {
  items: T[]
}

interface DirectoryViewProps {
  isLoading: boolean
  mode: 'people' | 'organisations'
  organisations: OrganisationRecord[]
  people: PersonRecord[]
}

const directoryCopy = {
  people: {
    kicker: 'Relationship directory · People',
    title: 'Know who moves the work.',
    button: 'Add person',
    search: 'Name, role, or organisation',
  },
  organisations: {
    kicker: 'Relationship directory · Organisations',
    title: 'See the network around each case.',
    button: 'Add organisation',
    search: 'Name or domain',
  },
} as const

export function DirectoryView({
  isLoading,
  mode,
  organisations,
  people,
}: DirectoryViewProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setEditing] = useState(false)
  const copy = directoryCopy[mode]

  useEffect(() => {
    setSearch('')
    setSelectedId(null)
    setDialogOpen(false)
    setEditing(false)
  }, [mode])

  const filteredQuery = useQuery({
    queryKey: [mode, 'search', search],
    queryFn: () =>
      apiClient<DirectoryResponse<PersonRecord | OrganisationRecord>>(
        `/api/v1/${mode}?q=${encodeURIComponent(search.trim())}`
      ),
    enabled: search.trim().length > 0,
  })

  const sourceItems = mode === 'people' ? people : organisations
  const items = search.trim() ? (filteredQuery.data?.items ?? []) : sourceItems
  const selectedItem =
    items.find((item) => item.id === selectedId) ?? items[0] ?? null

  const createOrganisationMutation = useMutation({
    mutationFn: (input: CreateOrganisationInput) =>
      apiClient<{ item: OrganisationRecord }>('/api/v1/organisations', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async ({ item }) => {
      setSelectedId(item.id)
      setDialogOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['organisations'] })
    },
  })

  const createPersonMutation = useMutation({
    mutationFn: (input: CreatePersonInput) =>
      apiClient<{ item: PersonRecord }>('/api/v1/people', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async ({ item }) => {
      setSelectedId(item.id)
      setDialogOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['people'] }),
        queryClient.invalidateQueries({ queryKey: ['organisations'] }),
      ])
    },
  })

  const updateOrganisationMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateOrganisationInput
    }) =>
      apiClient<{ item: OrganisationRecord }>(`/api/v1/organisations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setDialogOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['organisations'] })
    },
  })

  const updatePersonMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePersonInput }) =>
      apiClient<{ item: PersonRecord }>(`/api/v1/people/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setDialogOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['people'] }),
        queryClient.invalidateQueries({ queryKey: ['organisations'] }),
      ])
    },
  })

  const linkedCaseCount = useMemo(
    () => sourceItems.reduce((sum, item) => sum + item.linkedCaseCount, 0),
    [sourceItems]
  )

  return (
    <>
      <header className="workspace-header directory-heading">
        <div>
          <p className="utility-label">{copy.kicker}</p>
          <h1>{copy.title}</h1>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => {
            setEditing(false)
            setDialogOpen(true)
          }}
        >
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

      <div className="workspace-grid directory-grid">
        <section className="case-workspace">
          <div className="section-header">
            <div>
              <p className="utility-label">Current index</p>
              <h2>{mode === 'people' ? 'All people' : 'All organisations'}</h2>
            </div>
            <label className="search-field">
              <span>Search</span>
              <input
                type="search"
                value={search}
                placeholder={copy.search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="table-wrap directory-table-wrap">
            {mode === 'people' ? (
              <PeopleTable
                items={items as PersonRecord[]}
                selectedId={selectedItem?.id ?? null}
                onSelect={setSelectedId}
              />
            ) : (
              <OrganisationsTable
                items={items as OrganisationRecord[]}
                selectedId={selectedItem?.id ?? null}
                onSelect={setSelectedId}
              />
            )}
            {(isLoading || filteredQuery.isLoading) && (
              <div className="table-message">Loading the directory…</div>
            )}
            {!isLoading && !filteredQuery.isLoading && items.length === 0 && (
              <div className="table-message">
                No records match this search. Add a record or clear the query.
              </div>
            )}
          </div>
        </section>

        <aside className="case-detail directory-detail">
          {selectedItem ? (
            mode === 'people' ? (
              <PersonDetail
                item={selectedItem as PersonRecord}
                onEdit={() => {
                  setEditing(true)
                  setDialogOpen(true)
                }}
              />
            ) : (
              <OrganisationDetail
                item={selectedItem as OrganisationRecord}
                onEdit={() => {
                  setEditing(true)
                  setDialogOpen(true)
                }}
              />
            )
          ) : (
            <div className="table-message">Select a directory record.</div>
          )}
        </aside>
      </div>

      {isDialogOpen && mode === 'people' && (
        <NewPersonDialog
          isSaving={
            createPersonMutation.isPending || updatePersonMutation.isPending
          }
          organisations={organisations}
          item={isEditing ? (selectedItem as PersonRecord) : undefined}
          onClose={() => setDialogOpen(false)}
          onCreate={(input) => {
            if (isEditing && selectedItem) {
              return updatePersonMutation
                .mutateAsync({ id: selectedItem.id, input })
                .then(() => undefined)
            }
            return createPersonMutation.mutateAsync(input).then(() => undefined)
          }}
        />
      )}
      {isDialogOpen && mode === 'organisations' && (
        <NewOrganisationDialog
          isSaving={
            createOrganisationMutation.isPending ||
            updateOrganisationMutation.isPending
          }
          item={isEditing ? (selectedItem as OrganisationRecord) : undefined}
          onClose={() => setDialogOpen(false)}
          onCreate={(input) => {
            if (isEditing && selectedItem) {
              return updateOrganisationMutation
                .mutateAsync({ id: selectedItem.id, input })
                .then(() => undefined)
            }
            return createOrganisationMutation
              .mutateAsync(input)
              .then(() => undefined)
          }}
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
  items,
  onSelect,
  selectedId,
}: {
  items: PersonRecord[]
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  return (
    <table>
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
          <tr
            className={item.id === selectedId ? 'active-row' : ''}
            key={item.id}
          >
            <td>
              <button
                className="case-link cursor-pointer"
                type="button"
                onClick={() => onSelect(item.id)}
              >
                <span>{item.fullName}</span>
                <small>{item.roleTitle ?? 'No role recorded'}</small>
              </button>
            </td>
            <td>{item.organisationName ?? 'Independent'}</td>
            <td>{item.email ?? item.phone ?? 'No contact method'}</td>
            <td>{item.linkedCaseCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function OrganisationsTable({
  items,
  onSelect,
  selectedId,
}: {
  items: OrganisationRecord[]
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  return (
    <table>
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
          <tr
            className={item.id === selectedId ? 'active-row' : ''}
            key={item.id}
          >
            <td>
              <button
                className="case-link cursor-pointer"
                type="button"
                onClick={() => onSelect(item.id)}
              >
                <span>{item.displayName}</span>
                <small>{item.status}</small>
              </button>
            </td>
            <td>{item.domain ?? 'No domain'}</td>
            <td>{item.contactCount}</td>
            <td>{item.linkedCaseCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PersonDetail({
  item,
  onEdit,
}: {
  item: PersonRecord
  onEdit: () => void
}) {
  return (
    <>
      <div className="detail-kicker">
        <span>{item.status}</span>
        <span>{item.linkedCaseCount} case links</span>
      </div>
      <h2>{item.preferredName || item.fullName}</h2>
      <p className="detail-organisation">{item.fullName}</p>
      <dl className="detail-facts">
        <div>
          <dt>Organisation</dt>
          <dd>{item.organisationName ?? 'Independent'}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{item.roleTitle ?? 'Not recorded'}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{item.email ?? 'Not recorded'}</dd>
        </div>
        <div>
          <dt>Telephone</dt>
          <dd>{item.phone ?? 'Not recorded'}</dd>
        </div>
      </dl>
      <div className="directory-note">
        <p className="utility-label">Coordination note</p>
        <p>{item.summary ?? 'Add context before the next interaction.'}</p>
      </div>
      {item.email && (
        <a
          className="directory-contact cursor-pointer"
          href={`mailto:${item.email}`}
        >
          Email {item.preferredName || item.fullName}
        </a>
      )}
      <button
        className="directory-edit cursor-pointer"
        type="button"
        onClick={onEdit}
      >
        Edit person
      </button>
    </>
  )
}

function OrganisationDetail({
  item,
  onEdit,
}: {
  item: OrganisationRecord
  onEdit: () => void
}) {
  return (
    <>
      <div className="detail-kicker">
        <span>{item.status}</span>
        <span>{item.linkedCaseCount} case links</span>
      </div>
      <h2>{item.displayName}</h2>
      <p className="detail-organisation">
        {item.domain ?? 'No domain recorded'}
      </p>
      <dl className="detail-facts">
        <div>
          <dt>People</dt>
          <dd>{item.contactCount}</dd>
        </div>
        <div>
          <dt>Cases</dt>
          <dd>{item.linkedCaseCount}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{item.status}</dd>
        </div>
        <div>
          <dt>Domain</dt>
          <dd>{item.domain ?? 'Not recorded'}</dd>
        </div>
      </dl>
      <div className="directory-note">
        <p className="utility-label">Organisation context</p>
        <p>{item.summary ?? 'Add a shared summary for coordinators.'}</p>
      </div>
      {item.website && (
        <a
          className="directory-contact cursor-pointer"
          href={item.website}
          rel="noreferrer"
          target="_blank"
        >
          Visit website
        </a>
      )}
      <button
        className="directory-edit cursor-pointer"
        type="button"
        onClick={onEdit}
      >
        Edit organisation
      </button>
    </>
  )
}
