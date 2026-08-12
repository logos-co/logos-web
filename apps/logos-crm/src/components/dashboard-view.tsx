'use client'

import { Button } from '@acid-info/logos-ui'
import Link from 'next/link'

import type { CaseRecord, CaseStatus } from '@/contracts/case'

import { statusLabels, StatusBadge } from './case-status'

interface DashboardSummary {
  total: number
  openTotal: number
  byStatus: Record<CaseStatus, number>
}

interface DashboardViewProps {
  cases: CaseRecord[]
  isError: boolean
  isLoading: boolean
  onNewCase: () => void
  onRetry: () => void
  organisationCount: number
  peopleCount: number
  summary?: DashboardSummary
}

const openStatuses = new Set<CaseStatus>(['new', 'in_progress', 'waiting'])
const priorityWeight = { high: 0, medium: 1, low: 2 } as const
const pipelineStatuses: readonly CaseStatus[] = [
  'new',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
]

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function getDueState(value: string | null): { label: string; tone: string } {
  // An untriaged case has no due date, and pretending it has one would hide the
  // only thing that actually needs doing: triaging it.
  if (!value) return { label: 'Needs triage', tone: 'overdue' }

  const dueDate = value.slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  if (dueDate < today) {
    return { label: `Overdue · ${formatDueDate(value)}`, tone: 'overdue' }
  }
  if (dueDate === today) {
    return { label: 'Due today', tone: 'today' }
  }
  return { label: `Due ${formatDueDate(value)}`, tone: 'upcoming' }
}

function formatUpdatedDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function DashboardView({
  cases,
  isError,
  isLoading,
  onNewCase,
  onRetry,
  organisationCount,
  peopleCount,
  summary,
}: DashboardViewProps) {
  const attentionCases = [...cases]
    .filter((item) => openStatuses.has(item.status))
    .sort((left, right) => {
      const priorityDifference =
        priorityWeight[left.priority] - priorityWeight[right.priority]
      if (priorityDifference !== 0) return priorityDifference
      // Untriaged cases sort ahead of dated ones at the same priority: they are
      // the work that has not been looked at yet.
      if (!left.nextActionAt || !right.nextActionAt) {
        return (
          Number(Boolean(left.nextActionAt)) -
          Number(Boolean(right.nextActionAt))
        )
      }
      return (
        new Date(left.nextActionAt).getTime() -
        new Date(right.nextActionAt).getTime()
      )
    })
    .slice(0, 5)

  return (
    <>
      <header className="workspace-header dashboard-heading">
        <h1>Dashboard</h1>
        <Button className="cursor-pointer" onClick={onNewCase}>
          New case
        </Button>
      </header>

      {isLoading && <DashboardState message="Loading the dashboard…" />}

      {isError && !isLoading && (
        <DashboardState message="The dashboard could not be loaded.">
          <button
            className="table-state-action cursor-pointer"
            type="button"
            onClick={onRetry}
          >
            Retry
          </button>
        </DashboardState>
      )}

      {!isLoading && !isError && (
        <>
          <section className="dashboard-overview" aria-label="CRM overview">
            <article className="dashboard-open-work">
              <div>
                <span>Open cases</span>
                <strong>{summary?.openTotal ?? 0}</strong>
              </div>
              <p>
                {summary?.byStatus.waiting ?? 0} waiting,{' '}
                {summary?.byStatus.in_progress ?? 0} in progress
              </p>
              <Link
                className="dashboard-primary-link cursor-pointer"
                href="/cases"
              >
                View all cases
              </Link>
            </article>

            <div className="dashboard-metrics">
              <DashboardMetric
                href="/cases"
                label="Waiting"
                value={summary?.byStatus.waiting ?? 0}
              />
              <DashboardMetric
                href="/cases"
                label="In progress"
                value={summary?.byStatus.in_progress ?? 0}
              />
              <DashboardMetric
                href="/people"
                label="People"
                value={peopleCount}
              />
              <DashboardMetric
                href="/organisations"
                label="Organisations"
                value={organisationCount}
              />
            </div>
          </section>

          <div className="dashboard-workspace">
            <section className="dashboard-panel dashboard-attention">
              <header className="dashboard-panel-heading">
                <div>
                  <h2>Needs attention</h2>
                  <p>Open work ordered by priority and due date</p>
                </div>
                <span>{attentionCases.length}</span>
              </header>

              <div className="dashboard-case-list">
                {attentionCases.map((item) => {
                  const dueState = getDueState(item.nextActionAt)

                  return (
                    <Link
                      className="dashboard-case-row cursor-pointer"
                      href={`/cases/${item.id}`}
                      key={item.id}
                    >
                      <div className="dashboard-case-identity">
                        <strong>{item.title}</strong>
                        <span>
                          {item.organisationName ?? 'No organisation'}
                        </span>
                      </div>
                      <div className="dashboard-next-action">
                        <span>Next action</span>
                        <strong>{item.nextAction ?? 'Not set'}</strong>
                      </div>
                      <div className="dashboard-case-meta">
                        <StatusBadge value={item.status} />
                        <time
                          className={`due-${dueState.tone}`}
                          {...(item.nextActionAt
                            ? { dateTime: item.nextActionAt }
                            : {})}
                        >
                          {dueState.label}
                        </time>
                      </div>
                    </Link>
                  )
                })}

                {attentionCases.length === 0 && (
                  <div className="dashboard-empty">
                    <p>No open cases need attention.</p>
                    <button
                      className="table-state-action cursor-pointer"
                      type="button"
                      onClick={onNewCase}
                    >
                      Create a case
                    </button>
                  </div>
                )}
              </div>
            </section>

            <aside className="dashboard-panel dashboard-pipeline">
              <header className="dashboard-panel-heading">
                <div>
                  <h2>Pipeline</h2>
                  <p>{summary?.total ?? 0} cases in total</p>
                </div>
              </header>

              <div className="dashboard-pipeline-list">
                {pipelineStatuses.map((status) => {
                  const value = summary?.byStatus[status] ?? 0
                  const percentage = summary?.total
                    ? Math.max((value / summary.total) * 100, value > 0 ? 8 : 0)
                    : 0

                  return (
                    <div key={status}>
                      <div>
                        <span>{statusLabels[status]}</span>
                        <strong>{value}</strong>
                      </div>
                      <span className="dashboard-pipeline-track">
                        <i style={{ width: `${percentage}%` }} />
                      </span>
                    </div>
                  )
                })}
              </div>

              {cases[0] ? (
                <Link
                  className="dashboard-latest-update cursor-pointer"
                  href={`/cases/${cases[0].id}`}
                >
                  <span>Latest update</span>
                  <strong>{cases[0].title}</strong>
                  <time dateTime={cases[0].updatedAt}>
                    {formatUpdatedDate(cases[0].updatedAt)}
                  </time>
                </Link>
              ) : (
                <div className="dashboard-latest-update">
                  <span>Latest update</span>
                  <strong>No cases yet</strong>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </>
  )
}

function DashboardMetric({
  href,
  label,
  value,
}: {
  href: string
  label: string
  value: number
}) {
  return (
    <Link className="dashboard-metric cursor-pointer" href={href}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Link>
  )
}

function DashboardState({
  children,
  message,
}: {
  children?: React.ReactNode
  message: string
}) {
  return (
    <div className="dashboard-state">
      <p>{message}</p>
      {children}
    </div>
  )
}
