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
import type { PipelineKey } from '@/contracts/pipeline'
import { getPipeline, pipelineList, stageLabel } from '@/contracts/pipeline'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import type { UserRecord } from '@/contracts/user'
import { apiClient } from '@/lib/api-client'

import { CaseBoard, type StageMove } from './case-board'
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
  view: Exclude<WorkspaceView, 'reports' | 'scout' | 'search'>
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
  const [pipeline, setPipeline] = useState<PipelineKey>('ecodev')
  const [layout, setLayout] = useState<'board' | 'list'>('board')
  const [ownerUserId, setOwnerUserId] = useState<string>('')
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 4_000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  /**
   * Every pipeline is fetched, and the board narrows to one afterwards.
   *
   * Filtering server-side instead would hide work rather than move it: the
   * public funnel files submissions on the Movement board, so a coordinator
   * sitting on Ecodev would see "Needs triage 1" in the tab - those counts are
   * whole-workspace - and an empty board under it. Holding every pipeline here
   * lets the pipeline tabs carry their own counts, which turns "where is that
   * case" into something visible instead of something you go looking for. The
   * endpoint keeps its `pipeline` filter for exports and other callers.
   */
  const casesQuery = useQuery({
    queryKey: ['cases', deferredSearch, status, queue, ownerUserId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (deferredSearch) params.set('q', deferredSearch)
      if (status !== 'all') params.set('status', status)
      if (queue !== 'all') params.set('queue', queue)
      if (ownerUserId) params.set('ownerUserId', ownerUserId)
      const suffix = params.size > 0 ? `?${params.toString()}` : ''
      return apiClient<CasesResponse>(`/api/v1/cases${suffix}`)
    },
    placeholderData: (previous) => previous,
  })

  // Scoped to the selected pipeline so the queue tabs and the status ribbon
  // count the same cases the board is showing. Unscoped, the ribbon read "6"
  // over a board holding 4.
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', pipeline],
    queryFn: () =>
      apiClient<DashboardResponse>(`/api/v1/dashboard?pipeline=${pipeline}`),
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

  /**
   * Optimistic on purpose. A board where the card returns to its old column for
   * a moment before jumping to the new one reads as a failed drop, and people
   * drag it again. The previous list is captured so a rejected move - a stale
   * version, a stage that is not on this pipeline - puts the card back exactly
   * where it was rather than leaving the board guessing.
   */
  const moveMutation = useMutation({
    mutationFn: ({ id, stage, expectedVersion }: StageMove) =>
      apiClient<{ item: CaseRecord }>(`/api/v1/cases/${id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage, expectedVersion }),
      }),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['cases'] })
      const previous = queryClient.getQueriesData<CasesResponse>({
        queryKey: ['cases'],
      })
      queryClient.setQueriesData<CasesResponse>(
        { queryKey: ['cases'] },
        (current) =>
          current && {
            ...current,
            items: current.items.map((item) =>
              item.id === id ? { ...item, stage } : item
            ),
          }
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      for (const [key, value] of context?.previous ?? []) {
        queryClient.setQueryData(key, value)
      }
      setFeedback('The case could not be moved. Reload and try again.')
    },
    onSuccess: ({ item }) => {
      setFeedback(`Moved to ${stageLabel(item.pipeline, item.stage)}.`)
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })

  const items = casesQuery.data?.items ?? []
  // The board needs one vocabulary to build columns from; the list does not, so
  // it shows every pipeline and names which one each case is on.
  const boardItems = useMemo(
    () => items.filter((item) => item.pipeline === pipeline),
    [items, pipeline]
  )
  const visibleItems = layout === 'board' ? boardItems : items
  const countByPipeline = useMemo(() => {
    const counts = new Map<PipelineKey, number>()
    for (const item of items) {
      counts.set(item.pipeline, (counts.get(item.pipeline) ?? 0) + 1)
    }
    return counts
  }, [items])
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
      {
        id: 'stage',
        header: 'Stage',
        // The label, not the stored key. The list and the board have to name
        // the same column the same way or they read as two different systems.
        // The pipeline is named alongside it because the two vocabularies do
        // not overlap, and "Eligible" says nothing without knowing whose board
        // it is on.
        cell: ({ row }) => (
          <span className="stage-cell">
            <span>{stageLabel(row.original.pipeline, row.original.stage)}</span>
            <small>{getPipeline(row.original.pipeline).label}</small>
          </span>
        ),
      },
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

            <nav className="pipeline-tabs" aria-label="Pipelines">
              {pipelineList.map((item) => (
                <button
                  aria-pressed={pipeline === item.key}
                  className={`pipeline-tab cursor-pointer ${pipeline === item.key ? 'selected' : ''}`}
                  key={item.key}
                  type="button"
                  onClick={() => setPipeline(item.key)}
                >
                  <span>{item.label}</span>
                  <b>{countByPipeline.get(item.key) ?? 0}</b>
                </button>
              ))}
              <span className="pipeline-tabs-spacer" />
              <label className="board-owner-filter">
                <span className="visually-hidden">Filter by owner</span>
                <select
                  value={ownerUserId}
                  onChange={(event) => setOwnerUserId(event.target.value)}
                >
                  <option value="">Everyone&rsquo;s cases</option>
                  {(usersQuery.data?.items ?? []).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="layout-toggle" role="group" aria-label="Layout">
                <button
                  aria-pressed={layout === 'board'}
                  className={`layout-toggle-option cursor-pointer ${layout === 'board' ? 'selected' : ''}`}
                  type="button"
                  onClick={() => setLayout('board')}
                >
                  Board
                </button>
                <button
                  aria-pressed={layout === 'list'}
                  className={`layout-toggle-option cursor-pointer ${layout === 'list' ? 'selected' : ''}`}
                  type="button"
                  onClick={() => setLayout('list')}
                >
                  List
                </button>
              </div>
            </nav>

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
                    {visibleItems.length}{' '}
                    {visibleItems.length === 1 ? 'case' : 'cases'}
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

              {layout === 'board' ? (
                <CaseBoard
                  cases={boardItems}
                  isBusy={casesQuery.isFetching || moveMutation.isPending}
                  pipeline={pipeline}
                  onMove={(move) => moveMutation.mutate(move)}
                />
              ) : (
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
                </div>
              )}

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
                visibleItems.length === 0 && (
                  <TableMessage>
                    <p>No cases match these filters.</p>
                    {/*
                      A board shows one pipeline, so "nothing here" is
                      ambiguous: the case may exist on another team's board.
                      Say which one and offer the switch, rather than leaving
                      someone to find it by clicking through the tabs.
                    */}
                    {layout === 'board' &&
                      pipelineList
                        .filter(
                          (item) =>
                            item.key !== pipeline &&
                            (countByPipeline.get(item.key) ?? 0) > 0
                        )
                        .map((item) => (
                          <button
                            className="table-state-action cursor-pointer"
                            key={item.key}
                            type="button"
                            onClick={() => setPipeline(item.key)}
                          >
                            {countByPipeline.get(item.key)} on {item.label}
                          </button>
                        ))}
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
