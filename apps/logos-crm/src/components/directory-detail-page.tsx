'use client'

import { Button } from '@acid-info/logos-ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import type {
  OrganisationRecord,
  PersonRecord,
  UpdateOrganisationInput,
  UpdatePersonInput,
} from '@/contracts/directory'
import { apiClient } from '@/lib/api-client'

import { CrmShell } from './crm-shell'
import { DuplicateSuggestions } from './duplicate-suggestions'
import { NewOrganisationDialog } from './new-organisation-dialog'
import { NewPersonDialog } from './new-person-dialog'
import { RecordWork } from './record-work'

interface DirectoryDetailPageProps {
  id: string
  mode: 'people' | 'organisations'
}

interface DirectoryResponse<T> {
  items: T[]
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function DirectoryDetailPage({ id, mode }: DirectoryDetailPageProps) {
  const queryClient = useQueryClient()
  const [isEditing, setEditing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const isPerson = mode === 'people'
  const queryKey = [isPerson ? 'person' : 'organisation', id]
  const detailQuery = useQuery({
    queryKey,
    queryFn: () =>
      apiClient<{ item: PersonRecord | OrganisationRecord }>(
        `/api/v1/${mode}/${id}`
      ),
  })
  const organisationsQuery = useQuery({
    queryKey: ['organisations'],
    queryFn: () =>
      apiClient<DirectoryResponse<OrganisationRecord>>('/api/v1/organisations'),
    enabled: isPerson,
  })

  const updatePersonMutation = useMutation({
    mutationFn: (input: UpdatePersonInput) =>
      apiClient<{ item: PersonRecord }>(`/api/v1/people/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setEditing(false)
      setFeedback('Person updated.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['people'] }),
        queryClient.invalidateQueries({ queryKey: ['organisations'] }),
      ])
    },
    onError: () => setFeedback('The person could not be updated. Retry.'),
  })
  const updateOrganisationMutation = useMutation({
    mutationFn: (input: UpdateOrganisationInput) =>
      apiClient<{ item: OrganisationRecord }>(`/api/v1/organisations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setEditing(false)
      setFeedback('Organisation updated.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['organisations'] }),
      ])
    },
    onError: () => setFeedback('The organisation could not be updated. Retry.'),
  })

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 4_000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const item = detailQuery.data?.item

  return (
    <>
      <CrmShell view={mode}>
        {detailQuery.isLoading && (
          <DetailState>Loading the record…</DetailState>
        )}
        {detailQuery.isError && (
          <DetailState>
            This record could not be loaded. Return to the directory and retry.
          </DetailState>
        )}
        {item &&
          (isPerson ? (
            <PersonRecordPage
              item={item as PersonRecord}
              onEdit={() => setEditing(true)}
            />
          ) : (
            <OrganisationRecordPage
              item={item as OrganisationRecord}
              onEdit={() => setEditing(true)}
            />
          ))}
      </CrmShell>

      {isEditing && isPerson && item && (
        <NewPersonDialog
          isSaving={updatePersonMutation.isPending}
          item={item as PersonRecord}
          organisations={organisationsQuery.data?.items ?? []}
          onClose={() => setEditing(false)}
          onCreate={(input) =>
            updatePersonMutation.mutateAsync(input).then(() => undefined)
          }
        />
      )}
      {isEditing && !isPerson && item && (
        <NewOrganisationDialog
          isSaving={updateOrganisationMutation.isPending}
          item={item as OrganisationRecord}
          onClose={() => setEditing(false)}
          onCreate={(input) =>
            updateOrganisationMutation.mutateAsync(input).then(() => undefined)
          }
        />
      )}
      {feedback && (
        <div className="feedback-toast" role="status">
          {feedback}
        </div>
      )}
    </>
  )
}

function PersonRecordPage({
  item,
  onEdit,
}: {
  item: PersonRecord
  onEdit: () => void
}) {
  return (
    <article className="directory-record-page record-page">
      <Link className="record-back cursor-pointer" href="/people">
        Back to people
      </Link>
      <header className="record-page-header">
        <div>
          <div className="record-page-kicker">
            <span>{item.status}</span>
            <span>{item.linkedCaseCount} case links</span>
          </div>
          <h1>{item.preferredName || item.fullName}</h1>
          <p>{item.roleTitle ?? item.fullName}</p>
        </div>
        <Button className="cursor-pointer" onClick={onEdit}>
          Edit person
        </Button>
      </header>

      <div className="record-page-grid">
        <section className="record-context-card">
          <p className="utility-label">Coordination note</p>
          <h2>{item.summary ?? 'Add context before the next interaction.'}</h2>
          <div className="record-contact-actions">
            {item.email && (
              <a
                className="directory-contact cursor-pointer"
                href={`mailto:${item.email}`}
              >
                Email {item.preferredName || item.fullName}
              </a>
            )}
          </div>
        </section>

        <section className="record-facts-card">
          <p className="utility-label">Person details</p>
          <dl className="record-facts">
            <div>
              <dt>Organisation</dt>
              <dd>
                {item.organisationId ? (
                  <Link
                    className="cursor-pointer"
                    href={`/organisations/${item.organisationId}`}
                  >
                    {item.organisationName}
                  </Link>
                ) : (
                  'Independent'
                )}
              </dd>
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
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(item.updatedAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="record-work-card">
          <div className="record-section-heading">
            <div>
              <p className="utility-label">Coordination</p>
              <h2>Work history</h2>
            </div>
          </div>
          <RecordWork subjectId={item.id} subjectType="person" />
        </section>

        <DuplicateSuggestions id={item.id} kind="people" />
      </div>
    </article>
  )
}

function OrganisationRecordPage({
  item,
  onEdit,
}: {
  item: OrganisationRecord
  onEdit: () => void
}) {
  return (
    <article className="directory-record-page record-page">
      <Link className="record-back cursor-pointer" href="/organisations">
        Back to organisations
      </Link>
      <header className="record-page-header">
        <div>
          <div className="record-page-kicker">
            <span>{item.status}</span>
            <span>{item.linkedCaseCount} case links</span>
          </div>
          <h1>{item.displayName}</h1>
          <p>{item.domain ?? 'No domain recorded'}</p>
        </div>
        <Button className="cursor-pointer" onClick={onEdit}>
          Edit organisation
        </Button>
      </header>

      <div className="record-page-grid">
        <section className="record-context-card">
          <p className="utility-label">Organisation context</p>
          <h2>{item.summary ?? 'Add a shared summary for coordinators.'}</h2>
          <div className="record-contact-actions">
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
          </div>
        </section>

        <section className="record-facts-card">
          <p className="utility-label">Organisation details</p>
          <dl className="record-facts">
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
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(item.updatedAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="record-work-card">
          <div className="record-section-heading">
            <div>
              <p className="utility-label">Coordination</p>
              <h2>Work history</h2>
            </div>
          </div>
          <RecordWork subjectId={item.id} subjectType="organisation" />
        </section>

        <DuplicateSuggestions id={item.id} kind="organisations" />
      </div>
    </article>
  )
}

function DetailState({ children }: { children: React.ReactNode }) {
  return <div className="detail-state">{children}</div>
}
