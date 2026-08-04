'use client'

import { Button, LogosMark } from '@acid-info/logos-ui'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { CaseRecord, CaseStatus, CreateCaseInput } from '@/contracts/case'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import { apiClient } from '@/lib/api-client'

import { DirectoryView } from './directory-view'
import { NewCaseDialog } from './new-case-dialog'
import { RecordWork } from './record-work'

interface CasesResponse {
  items: CaseRecord[]
}

interface DashboardResponse {
  total: number
  openTotal: number
  byStatus: Record<CaseStatus, number>
}

interface DirectoryResponse<T> {
  items: T[]
}

type WorkspaceView = 'cases' | 'people' | 'organisations'

interface CrmDemoProps {
  view: WorkspaceView
}

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

function revealDetail(element: HTMLElement | null): void {
  if (!element || !window.matchMedia('(max-width: 760px)').matches) return
  const behaviour = window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches
    ? 'auto'
    : 'smooth'
  requestAnimationFrame(() =>
    element.scrollIntoView({ behavior: behaviour, block: 'start' })
  )
}

export function CrmDemo({ view }: CrmDemoProps) {
  const queryClient = useQueryClient()
  const mainRef = useRef<HTMLElement>(null)
  const detailRef = useRef<HTMLElement>(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [status, setStatus] = useState<CaseStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' })
    mainRef.current?.focus({ preventScroll: true })
  }, [view])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 4_000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const casesQuery = useQuery({
    queryKey: ['cases', deferredSearch, status],
    queryFn: () => {
      const params = new URLSearchParams()
      if (deferredSearch) params.set('q', deferredSearch)
      if (status !== 'all') params.set('status', status)
      const suffix = params.size > 0 ? `?${params.toString()}` : ''
      return apiClient<CasesResponse>(`/api/v1/cases${suffix}`)
    },
    placeholderData: (previous) => previous,
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
      setFeedback('Case created.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
    onError: () => setFeedback('The case could not be created. Retry.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: CaseStatus }) =>
      apiClient<{ item: CaseRecord }>(`/api/v1/cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: value }),
      }),
    onSuccess: async () => {
      setFeedback('Case status updated.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
    onError: () => setFeedback('The case status could not be updated. Retry.'),
  })

  const items = casesQuery.data?.items ?? []
  const selectedCase = items.find((item) => item.id === selectedId) ?? items[0]
  const selectCase = useCallback((id: string): void => {
    setSelectedId(id)
    revealDetail(detailRef.current)
  }, [])

  const caseColumns = useMemo<ColumnDef<CaseRecord>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Case',
        cell: ({ row }) => (
          <button
            aria-pressed={selectedCase?.id === row.original.id}
            className="case-link cursor-pointer"
            type="button"
            onClick={() => selectCase(row.original.id)}
          >
            <span>{row.original.title}</span>
            <small>{row.original.organisation}</small>
          </button>
        ),
      },
      { accessorKey: 'stage', header: 'Stage' },
      { accessorKey: 'owner', header: 'Owner' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge value={getValue<CaseStatus>()} />,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
    ],
    [selectCase, selectedCase?.id]
  )

  const table = useReactTable({
    data: items,
    columns: caseColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="crm-shell">
      <a className="skip-link cursor-pointer" href="#main-content">
        Skip to workspace
      </a>
      <aside className="crm-sidebar">
        <div className="brand-block">
          <LogosMark size={30} />
          <div>
            <strong>Logos CRM</strong>
            <span>Coordination workspace</span>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="primary-nav">
          <Link
            aria-current={view === 'cases' ? 'page' : undefined}
            className={`${view === 'cases' ? 'active' : ''} cursor-pointer`}
            href="/cases"
          >
            Cases <span>{dashboardQuery.data?.total ?? '—'}</span>
          </Link>
          <Link
            aria-current={view === 'people' ? 'page' : undefined}
            className={`${view === 'people' ? 'active' : ''} cursor-pointer`}
            href="/people"
          >
            People <span>{peopleQuery.data?.items.length ?? '—'}</span>
          </Link>
          <Link
            aria-current={view === 'organisations' ? 'page' : undefined}
            className={`${view === 'organisations' ? 'active' : ''} cursor-pointer`}
            href="/organisations"
          >
            Organisations{' '}
            <span>{organisationsQuery.data?.items.length ?? '—'}</span>
          </Link>
        </nav>
      </aside>

      <main className="crm-main" id="main-content" ref={mainRef} tabIndex={-1}>
        {view === 'cases' ? (
          <>
            <header className="workspace-header">
              <div>
                <p className="utility-label">Coordination queue</p>
                <h1>Cases</h1>
              </div>
              <Button
                className="cursor-pointer"
                onClick={() => setDialogOpen(true)}
              >
                New case
              </Button>
            </header>

            <section className="pipeline-ribbon" aria-label="Case pipeline">
              <div className="pipeline-summary">
                <span>Open pipeline</span>
                <strong>{dashboardQuery.data?.openTotal ?? '—'}</strong>
              </div>
              {statuses.map((item, index) => (
                <button
                  aria-pressed={status === item}
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
              <section className="case-workspace">
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
                            <td
                              data-label={String(
                                cell.column.columnDef.header ?? ''
                              )}
                              key={cell.id}
                            >
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

              <aside className="case-detail" ref={detailRef}>
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

                    <div className="next-action">
                      <p className="utility-label">Next action</p>
                      <strong>{selectedCase.nextAction}</strong>
                      <span>Due {formatDate(selectedCase.nextActionAt)}</span>
                    </div>

                    <Button
                      className="case-status-action w-full cursor-pointer"
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

                    <RecordWork
                      key={selectedCase.id}
                      subjectId={selectedCase.id}
                      subjectType="case"
                    />
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
            onFeedback={setFeedback}
            organisations={organisationsQuery.data?.items ?? []}
            people={peopleQuery.data?.items ?? []}
          />
        )}
      </main>

      {feedback && (
        <div className="feedback-toast" role="status">
          {feedback}
        </div>
      )}

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
