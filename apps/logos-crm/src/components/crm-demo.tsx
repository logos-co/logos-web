'use client'

import { Button, LogosMark } from '@acid-info/logos-ui'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import type { CaseRecord, CaseStatus, CreateCaseInput } from '@/contracts/case'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import { apiClient } from '@/lib/api-client'

import { DirectoryView } from './directory-view'
import { NewCaseDialog } from './new-case-dialog'

interface CasesResponse {
  items: CaseRecord[]
}

interface DashboardResponse {
  total: number
  byStatus: Record<CaseStatus, number>
}

interface DirectoryResponse<T> {
  items: T[]
}

type WorkspaceView = 'cases' | 'people' | 'organisations'

const statuses: readonly CaseStatus[] = [
  'new',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
]

const statusLabels: Record<CaseStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
}

const nextStatus: Record<CaseStatus, CaseStatus> = {
  new: 'in_progress',
  in_progress: 'waiting',
  waiting: 'resolved',
  resolved: 'closed',
  closed: 'closed',
}

function formatDate(value: string | null): string {
  if (!value) return 'No contact yet'
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

export function CrmDemo() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CaseStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState<WorkspaceView>('cases')

  const casesQuery = useQuery({
    queryKey: ['cases', search, status],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (status !== 'all') params.set('status', status)
      const suffix = params.size > 0 ? `?${params.toString()}` : ''
      return apiClient<CasesResponse>(`/api/v1/cases${suffix}`)
    },
  })

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient<DashboardResponse>('/api/v1/dashboard'),
  })

  const peopleQuery = useQuery({
    queryKey: ['people'],
    queryFn: () => apiClient<DirectoryResponse<PersonRecord>>('/api/v1/people'),
  })

  const organisationsQuery = useQuery({
    queryKey: ['organisations'],
    queryFn: () =>
      apiClient<DirectoryResponse<OrganisationRecord>>('/api/v1/organisations'),
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateCaseInput) =>
      apiClient<{ item: CaseRecord }>('/api/v1/cases', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async ({ item }) => {
      setSelectedId(item.id)
      setDialogOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: CaseStatus }) =>
      apiClient<{ item: CaseRecord }>(`/api/v1/cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: value }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })

  const items = casesQuery.data?.items ?? []
  const selectedCase = items.find((item) => item.id === selectedId) ?? items[0]

  const columns = useMemo<ColumnDef<CaseRecord>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Case',
        cell: ({ row }) => (
          <button
            className="case-link cursor-pointer"
            type="button"
            onClick={() => setSelectedId(row.original.id)}
          >
            <span>{row.original.title}</span>
            <small>{row.original.organisation}</small>
          </button>
        ),
      },
      {
        accessorKey: 'stage',
        header: 'Stage',
      },
      {
        accessorKey: 'owner',
        header: 'Owner',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const value = getValue<CaseStatus>()
          return <StatusBadge value={value} />
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
    ],
    []
  )

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="crm-shell">
      <aside className="crm-sidebar">
        <div className="brand-block">
          <LogosMark size={30} />
          <div>
            <strong>Logos CRM</strong>
            <span>Coordination workspace</span>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="primary-nav">
          <button
            className={`${view === 'cases' ? 'active' : ''} cursor-pointer`}
            type="button"
            onClick={() => setView('cases')}
          >
            Cases <span>{dashboardQuery.data?.total ?? '—'}</span>
          </button>
          <button
            className={`${view === 'people' ? 'active' : ''} cursor-pointer`}
            type="button"
            onClick={() => setView('people')}
          >
            People <span>{peopleQuery.data?.items.length ?? '—'}</span>
          </button>
          <button
            className={`${view === 'organisations' ? 'active' : ''} cursor-pointer`}
            type="button"
            onClick={() => setView('organisations')}
          >
            Organisations{' '}
            <span>{organisationsQuery.data?.items.length ?? '—'}</span>
          </button>
        </nav>

        <div className="demo-note">
          <p>Demo workspace</p>
          <span>
            PostgreSQL-backed vertical slice. Authentication and migration are
            not active.
          </span>
        </div>

        <div className="operator-card">
          <span>Signed in as</span>
          <strong>Mara Chen</strong>
          <small>Coordinator · Demo</small>
        </div>
      </aside>

      <main className="crm-main">
        {view === 'cases' ? (
          <>
            <header className="workspace-header">
              <div>
                <p className="utility-label">Tuesday · Coordination queue</p>
                <h1>Move the next case forward.</h1>
              </div>
              <Button
                className="cursor-pointer"
                onClick={() => setDialogOpen(true)}
              >
                New case
              </Button>
            </header>

            <section
              className="pipeline-ribbon"
              id="pipeline"
              aria-label="Case pipeline"
            >
              <div className="pipeline-summary">
                <span>Open pipeline</span>
                <strong>{dashboardQuery.data?.total ?? '—'}</strong>
              </div>
              {statuses.map((item, index) => (
                <button
                  className={`pipeline-stage cursor-pointer ${status === item ? 'selected' : ''}`}
                  key={item}
                  type="button"
                  onClick={() => setStatus(status === item ? 'all' : item)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{statusLabels[item]}</strong>
                  <b>{dashboardQuery.data?.byStatus[item] ?? '—'}</b>
                </button>
              ))}
            </section>

            <div className="workspace-grid">
              <section className="case-workspace" id="case-list">
                <div className="section-header">
                  <div>
                    <p className="utility-label">Current queue</p>
                    <h2>
                      {status === 'all' ? 'All cases' : statusLabels[status]}
                    </h2>
                  </div>
                  <label className="search-field">
                    <span>Search</span>
                    <input
                      type="search"
                      value={search}
                      placeholder="Case, organisation, owner"
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th key={header.id}>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr
                          className={
                            selectedCase?.id === row.original.id
                              ? 'active-row'
                              : ''
                          }
                          key={row.id}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {casesQuery.isLoading && (
                    <TableMessage>Loading the queue…</TableMessage>
                  )}
                  {casesQuery.isError && (
                    <TableMessage>Connect PostgreSQL and retry.</TableMessage>
                  )}
                  {!casesQuery.isLoading &&
                    !casesQuery.isError &&
                    items.length === 0 && (
                      <TableMessage>No cases match these filters.</TableMessage>
                    )}
                </div>
              </section>

              <aside className="case-detail" id="activity">
                {selectedCase ? (
                  <>
                    <div className="detail-kicker">
                      <StatusBadge value={selectedCase.status} />
                      <span>{selectedCase.priority} priority</span>
                    </div>
                    <h2>{selectedCase.title}</h2>
                    <p className="detail-organisation">
                      {selectedCase.organisation}
                    </p>

                    <dl className="detail-facts">
                      <div>
                        <dt>Owner</dt>
                        <dd>{selectedCase.owner}</dd>
                      </div>
                      <div>
                        <dt>Stage</dt>
                        <dd>{selectedCase.stage}</dd>
                      </div>
                      <div>
                        <dt>Last contact</dt>
                        <dd>{formatDate(selectedCase.lastContactAt)}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{formatDate(selectedCase.updatedAt)}</dd>
                      </div>
                    </dl>

                    <div className="next-action">
                      <p className="utility-label">Next action</p>
                      <strong>{selectedCase.nextAction}</strong>
                      <span>Due {formatDate(selectedCase.nextActionAt)}</span>
                    </div>

                    <div className="activity-thread">
                      <p className="utility-label">Activity</p>
                      <div>
                        <span />
                        <p>
                          <strong>Case reviewed</strong>
                          <small>
                            {selectedCase.owner} ·{' '}
                            {formatDate(selectedCase.updatedAt)}
                          </small>
                        </p>
                      </div>
                      <div>
                        <span />
                        <p>
                          <strong>Next action set</strong>
                          <small>{selectedCase.nextAction}</small>
                        </p>
                      </div>
                    </div>

                    <div className="related-people">
                      <p className="utility-label">Related people</p>
                      {selectedCase.relatedPeople.length > 0 ? (
                        selectedCase.relatedPeople.map((person) => (
                          <div key={person.id}>
                            <strong>{person.fullName}</strong>
                            <span>{person.roleTitle ?? 'Contact'}</span>
                          </div>
                        ))
                      ) : (
                        <p>No people linked to this case.</p>
                      )}
                    </div>

                    <Button
                      className="w-full cursor-pointer"
                      disabled={
                        selectedCase.status === 'closed' ||
                        statusMutation.isPending
                      }
                      onClick={() =>
                        statusMutation.mutate({
                          id: selectedCase.id,
                          value: nextStatus[selectedCase.status],
                        })
                      }
                    >
                      {selectedCase.status === 'closed'
                        ? 'Case closed'
                        : `Move to ${statusLabels[nextStatus[selectedCase.status]]}`}
                    </Button>
                  </>
                ) : (
                  <TableMessage>
                    Select a case to review its next action.
                  </TableMessage>
                )}
              </aside>
            </div>
          </>
        ) : (
          <DirectoryView
            isLoading={peopleQuery.isLoading || organisationsQuery.isLoading}
            mode={view}
            organisations={organisationsQuery.data?.items ?? []}
            people={peopleQuery.data?.items ?? []}
          />
        )}
      </main>

      <NewCaseDialog
        isOpen={isDialogOpen}
        isSaving={createMutation.isPending}
        onClose={() => setDialogOpen(false)}
        onCreate={async (input) => {
          await createMutation.mutateAsync(input)
        }}
        organisations={organisationsQuery.data?.items ?? []}
        people={peopleQuery.data?.items ?? []}
      />
    </div>
  )
}

function StatusBadge({ value }: { value: CaseStatus }) {
  return (
    <span className={`status-badge status-${value}`}>
      <i /> {statusLabels[value]}
    </span>
  )
}

function TableMessage({ children }: { children: React.ReactNode }) {
  return <div className="table-message">{children}</div>
}
