'use client'

import { Button } from '@acid-info/logos-ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { CaseRecord, CaseStatus } from '@/contracts/case'
import { stageLabel } from '@/contracts/pipeline'
import { apiClient } from '@/lib/api-client'

import { CaseEvaluation } from './case-evaluation'
import { CaseResponseTemplate } from './case-response-template'
import { nextStatus, statusLabels, StatusBadge } from './case-status'
import { CrmShell } from './crm-shell'
import { RecordWork } from './record-work'

interface CaseDetailPageProps {
  id: string
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function CaseDetailPage({ id }: CaseDetailPageProps) {
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<string | null>(null)
  const caseQuery = useQuery({
    queryKey: ['case', id],
    queryFn: () => apiClient<{ item: CaseRecord }>(`/api/v1/cases/${id}`),
  })
  const statusMutation = useMutation({
    mutationFn: ({
      status,
      expectedVersion,
    }: {
      status: CaseStatus
      expectedVersion: number
    }) =>
      apiClient<{ item: CaseRecord }>(`/api/v1/cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, expectedVersion }),
      }),
    onSuccess: async () => {
      setFeedback('Case status updated.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['case', id] }),
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
    onError: async (error) => {
      // A rejected version means somebody else moved this case. Reload rather
      // than letting the operator retry into the same conflict.
      if (error instanceof Error && error.message.includes('CONFLICT')) {
        setFeedback('Somebody else updated this case. Reloading it.')
        await queryClient.invalidateQueries({ queryKey: ['case', id] })
        return
      }
      setFeedback('The case status could not be updated. Retry.')
    },
  })

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 4_000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const item = caseQuery.data?.item

  return (
    <>
      <CrmShell view="cases">
        {caseQuery.isLoading && <DetailState>Loading the case…</DetailState>}
        {caseQuery.isError && (
          <DetailState>
            This case could not be loaded. Return to the queue and retry.
          </DetailState>
        )}
        {item && (
          <article className="case-record-page record-page">
            <Link className="record-back cursor-pointer" href="/cases">
              Back to cases
            </Link>

            <header className="record-page-header">
              <div>
                <div className="record-page-kicker">
                  <StatusBadge value={item.status} />
                  <span>{item.priority} priority</span>
                </div>
                <h1>{item.title}</h1>
                <p>{item.organisationName ?? 'No organisation'}</p>
              </div>
            </header>

            <div className="record-page-grid">
              <section className="record-action-card">
                <p className="utility-label">Next action</p>
                <h2>{item.nextTask?.title ?? 'Not triaged yet'}</h2>
                <time>
                  {item.nextTask
                    ? `Due ${formatDate(item.nextTask.dueAt)} · ${item.nextTask.assignee?.displayName ?? 'Unassigned'}`
                    : 'No open task'}
                </time>
                <Button
                  className="cursor-pointer"
                  disabled={
                    item.status === 'closed' || statusMutation.isPending
                  }
                  onClick={() =>
                    statusMutation.mutate({
                      status: nextStatus[item.status],
                      expectedVersion: item.version,
                    })
                  }
                >
                  {item.status === 'closed'
                    ? 'Case closed'
                    : `Move to ${statusLabels[nextStatus[item.status]]}`}
                </Button>
              </section>

              <section className="record-facts-card">
                <p className="utility-label">Case details</p>
                <dl className="record-facts">
                  <div>
                    <dt>Owner</dt>
                    <dd>{item.owner?.displayName ?? 'Unassigned'}</dd>
                  </div>
                  <div>
                    <dt>Stage</dt>
                    <dd>{stageLabel(item.pipeline, item.stage)}</dd>
                  </div>
                  <div>
                    <dt>Last contact</dt>
                    <dd>{formatDate(item.lastContactAt)}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatDate(item.updatedAt)}</dd>
                  </div>
                </dl>
              </section>

              <section className="record-related-card">
                <div className="record-section-heading">
                  <div>
                    <p className="utility-label">Relationships</p>
                    <h2>Related people</h2>
                  </div>
                  <span>{item.relatedPeople.length}</span>
                </div>
                {item.relatedPeople.length > 0 ? (
                  <div className="record-related-list">
                    {item.relatedPeople.map((person) => (
                      <Link
                        className="cursor-pointer"
                        href={`/people/${person.id}`}
                        key={person.id}
                      >
                        <strong>{person.fullName}</strong>
                        <span>{person.roleTitle ?? 'Contact'}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="record-empty">No people linked to this case.</p>
                )}
              </section>

              <CaseEvaluation item={item} />

              <CaseResponseTemplate
                coordinatorName={item.owner?.displayName ?? 'the Logos team'}
                isSuppressed={item.relatedPeople.some(
                  (person) => person.doNotContact
                )}
                item={item}
              />

              <section className="record-work-card">
                <div className="record-section-heading">
                  <div>
                    <p className="utility-label">Coordination</p>
                    <h2>Work history</h2>
                  </div>
                </div>
                <RecordWork subjectId={item.id} subjectType="case" />
              </section>
            </div>
          </article>
        )}
      </CrmShell>

      {feedback && (
        <div className="feedback-toast" role="status">
          {feedback}
        </div>
      )}
    </>
  )
}

function DetailState({ children }: { children: React.ReactNode }) {
  return <div className="detail-state">{children}</div>
}
