'use client'

import { Button } from '@acid-info/logos-ui'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'

import type {
  CaseQueue,
  CaseRecord,
  CaseStatus,
  CreateCaseInput,
} from '@/contracts/case'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import type { UserRecord } from '@/contracts/user'
import { apiClient } from '@/lib/api-client'

import { statusLabels, StatusBadge } from './case-status'
import { CrmShell, type WorkspaceView } from './crm-shell'
import { DashboardView } from './dashboard-view'
import { DirectoryView } from './directory-view'
import { NewCaseDialog } from './new-case-dialog'
import { RecordRow } from './record-row'

interface CasesResponse {
  items: CaseRecord[]
}

interface DashboardResponse {
  total: number
  openTotal: number
  byStatus: Record<CaseStatus, number>
  queues: Record<CaseQueue, number>
}

/**
 * Queues come before the status filter in the UI because they answer "what
 * should I do next", which is the question a coordinator actually opens the app
 * with. Status is a way to slice a queue, not a queue in itself.
 */
const queueTabs: ReadonlyArray<{ value: CaseQueue; label: string }> = [
  { value: 'all', label: 'All cases' },
  { value: 'mine', label: 'My work' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'needs_triage', label: 'Needs triage' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'stale', label: 'Stale' },
]

interface DirectoryResponse<T> {
  items: T[]
}

interface CrmDemoProps {
  // Reports and search render from their own pages, so this component never
  // sees those views.
  view: Exclude<WorkspaceView, 'reports' | 'search'>
}

const statuses: readonly CaseStatus[] = [
  'new',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
]

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

export function CrmDemo({ view }: CrmDemoProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [status, setStatus] = useState<CaseStatus | 'all'>('all')
  const [queue, setQueue] = useState<CaseQueue>('all')
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 4_000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const casesQuery = useQuery({
    queryKey: ['cases', deferredSearch, status, queue],
    queryFn: () => {
      const params = new URLSearchParams()
      if (deferredSearch) params.set('q', deferredSearch)
      if (status !== 'all') params.set('status', status)
      if (queue !== 'all') params.set('queue', queue)
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

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient<DirectoryResponse<UserRecord>>('/api/v1/users'),
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateCaseInput) =>
      apiClient<{ item: CaseRecord }>('/api/v1/cases', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async ({ item }) => {
      setDialogOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      router.push(`/cases/${item.id}`)
    },
    onError: () => setFeedback('The case could not be created. Retry.'),
  })

  const items = casesQuery.data?.items ?? []
  const caseColumns = useMemo<ColumnDef<CaseRecord>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Case',
        cell: ({ row }) => (
          <Link
            aria-label={`Open case ${row.original.title}`}
            className="case-link cursor-pointer"
            href={`/cases/${row.original.id}`}
          >
            <span>{row.original.title}</span>
            <small>{row.original.organisationName ?? 'No organisation'}</small>
          </Link>
        ),
      },
      { accessorKey: 'stage', header: 'Stage' },
      {
        id: 'owner',
        header: 'Owner',
        cell: ({ row }) => row.original.owner?.displayName ?? 'Unassigned',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge value={getValue<CaseStatus>()} />,
      },
      {
        id: 'nextTask',
        header: 'Next action',
        // Reads the open task rather than the case's own field: the task is
        // what someone committed to, and showing anything else invites the two
        // to drift apart.
        cell: ({ row }) => {
          const task = row.original.nextTask
          if (!task) return <span className="muted-cell">Needs triage</span>
          const overdue = new Date(task.dueAt).getTime() < Date.now()
          return (
            <span className={overdue ? 'due-overdue' : undefined}>
              {task.title} · {formatDate(task.dueAt)}
            </span>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: items,
    columns: caseColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <CrmShell view={view}>
        {view === 'dashboard' ? (
          <DashboardView
            cases={items}
            isError={
              casesQuery.isError ||
              dashboardQuery.isError ||
              peopleQuery.isError ||
              organisationsQuery.isError
            }
            isLoading={
              casesQuery.isLoading ||
              dashboardQuery.isLoading ||
              peopleQuery.isLoading ||
              organisationsQuery.isLoading
            }
            onNewCase={() => setDialogOpen(true)}
            onRetry={() => {
              void Promise.all([
                casesQuery.refetch(),
                dashboardQuery.refetch(),
                peopleQuery.refetch(),
                organisationsQuery.refetch(),
              ])
            }}
            organisationCount={organisationsQuery.data?.items.length ?? 0}
            peopleCount={peopleQuery.data?.items.length ?? 0}
            summary={dashboardQuery.data}
          />
        ) : view === 'cases' ? (
          <>
            <header className="workspace-header">
              <h1>Cases</h1>
              <Button
                className="cursor-pointer"
                onClick={() => setDialogOpen(true)}
              >
                New case
              </Button>
            </header>

            <nav className="queue-tabs" aria-label="Case queues">
              {queueTabs.map((tab) => (
                <button
                  aria-pressed={queue === tab.value}
                  className={`queue-tab cursor-pointer ${queue === tab.value ? 'selected' : ''}`}
                  key={tab.value}
                  type="button"
                  onClick={() => setQueue(tab.value)}
                >
                  <span>{tab.label}</span>
                  <b>{dashboardQuery.data?.queues?.[tab.value] ?? '-'}</b>
                </button>
              ))}
            </nav>

            <section className="pipeline-ribbon" aria-label="Case pipeline">
              <button
                aria-pressed={status === 'all'}
                className="pipeline-summary cursor-pointer"
                type="button"
                onClick={() => setStatus('all')}
              >
                <span>All cases</span>
                <strong>{dashboardQuery.data?.total ?? '-'}</strong>
              </button>
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
                  <b>{dashboardQuery.data?.byStatus[item] ?? '-'}</b>
                </button>
              ))}
            </section>

            <section className="case-workspace list-workspace">
              <div className="section-header">
                <div className="section-title-group">
                  <h2>
                    {status === 'all' ? 'All cases' : statusLabels[status]}
                  </h2>
                  <span className="result-count" aria-live="polite">
                    {items.length} {items.length === 1 ? 'case' : 'cases'}
                  </span>
                </div>
                <div className="table-controls">
                  <label className="search-field">
                    <span>Search</span>
                    <input
                      type="search"
                      value={search}
                      placeholder="Case, organisation, owner"
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  {(search || status !== 'all') && (
                    <button
                      className="table-text-action cursor-pointer"
                      type="button"
                      onClick={() => {
                        setSearch('')
                        setStatus('all')
                        setQueue('all')
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              <div className="table-wrap">
                <table aria-busy={casesQuery.isFetching}>
                  <caption className="visually-hidden">
                    Cases. Select any row to open its detail page.
                  </caption>
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
                      <RecordRow
                        href={`/cases/${row.original.id}`}
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
                      </RecordRow>
                    ))}
                  </tbody>
                </table>

                {casesQuery.isLoading && (
                  <TableMessage>Loading the queue…</TableMessage>
                )}
                {casesQuery.isError && (
                  <TableMessage>
                    <p>The case list could not be loaded.</p>
                    <button
                      className="table-state-action cursor-pointer"
                      type="button"
                      onClick={() => casesQuery.refetch()}
                    >
                      Retry
                    </button>
                  </TableMessage>
                )}
                {!casesQuery.isLoading &&
                  !casesQuery.isError &&
                  items.length === 0 && (
                    <TableMessage>
                      <p>No cases match these filters.</p>
                      {(search || status !== 'all') && (
                        <button
                          className="table-state-action cursor-pointer"
                          type="button"
                          onClick={() => {
                            setSearch('')
                            setStatus('all')
                            setQueue('all')
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </TableMessage>
                  )}
              </div>
            </section>
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
      </CrmShell>

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
        users={usersQuery.data?.items ?? []}
      />
    </>
  )
}

function TableMessage({ children }: { children: React.ReactNode }) {
  return <div className="table-message">{children}</div>
}
