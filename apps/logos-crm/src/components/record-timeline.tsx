'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { TimelineEntry } from '@/contracts/timeline'
import type { CurrentActor } from '@/contracts/user'
import type { ActivityRecord, WorkSubjectType } from '@/contracts/work'
import { apiClient } from '@/lib/api-client'

import { RichTextEditor } from './rich-text-editor'
import { RichTextView } from './rich-text-view'

interface RecordTimelineProps {
  entries: readonly TimelineEntry[]
  isLoading: boolean
  subjectId: string
  subjectType: WorkSubjectType
  onFeedback: (message: string) => void
}

const kindLabels: Record<TimelineEntry['kind'], string> = {
  note: 'Note',
  contact: 'Contact',
  task_opened: 'Task',
  task_completed: 'Task',
  stage_changed: 'Stage',
  status_changed: 'Status',
  decision: 'Decision',
  assignment: 'Owner',
}

function formatMoment(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function TimelineItem({
  canEdit,
  entry,
  onEdited,
  onFeedback,
}: {
  canEdit: boolean
  entry: TimelineEntry
  onEdited: () => Promise<void>
  onFeedback: (message: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  const editMutation = useMutation({
    mutationFn: (body: string) =>
      apiClient<{ item: ActivityRecord }>(
        `/api/v1/activities/${entry.activityId}`,
        { method: 'PATCH', body: JSON.stringify({ body }) }
      ),
    onSuccess: async () => {
      setDraft(null)
      onFeedback('Note updated.')
      await onEdited()
    },
    onError: () => onFeedback('The note could not be updated.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiClient<{ item: ActivityRecord }>(
        `/api/v1/activities/${entry.activityId}`,
        { method: 'DELETE' }
      ),
    onSuccess: async () => {
      onFeedback('Note deleted.')
      await onEdited()
    },
    onError: () => onFeedback('The note could not be deleted.'),
  })

  /**
   * Only the author's own notes offer Edit and Delete. The server enforces
   * this either way, but an affordance that always ends in a 403 teaches
   * people to distrust the buttons rather than teaching them the rule.
   */
  const isEditable = canEdit && entry.activityId !== null && !entry.isDeleted

  return (
    <article className="timeline-item" data-kind={entry.kind}>
      <span className={`timeline-mark timeline-${entry.kind}`} />
      <div className="timeline-body">
        <p className="timeline-heading">
          <strong>{entry.actor?.displayName ?? 'System'}</strong>
          <span> {entry.summary}</span>
          <time dateTime={entry.occurredAt}>
            {formatMoment(entry.occurredAt)}
          </time>
          <i className="timeline-kind">{kindLabels[entry.kind]}</i>
        </p>

        {entry.isDeleted && (
          <p className="timeline-deleted">This note was deleted.</p>
        )}

        {draft !== null ? (
          <div className="timeline-edit">
            <RichTextEditor
              label="Edit note"
              rows={5}
              value={draft}
              onChange={setDraft}
            />
            <div className="timeline-edit-actions">
              <button
                className="work-text-action cursor-pointer"
                disabled={editMutation.isPending || !draft.trim()}
                type="button"
                onClick={() => editMutation.mutate(draft)}
              >
                {editMutation.isPending ? 'Saving…' : 'Save note'}
              </button>
              <button
                className="work-text-action cursor-pointer"
                type="button"
                onClick={() => setDraft(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          entry.body && <RichTextView body={entry.body} />
        )}

        {entry.editedAt && draft === null && (
          <small className="timeline-edited">
            Edited {formatMoment(entry.editedAt)}
          </small>
        )}

        {isEditable && draft === null && (
          <div className="timeline-item-actions">
            <button
              className="work-text-action cursor-pointer"
              type="button"
              onClick={() => setDraft(entry.body ?? '')}
            >
              Edit
            </button>
            <button
              className="work-text-action cursor-pointer"
              disabled={deleteMutation.isPending}
              type="button"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

/**
 * One chronological history for the record.
 *
 * Notes stay editable here rather than only where they were written, because
 * this is where somebody reads them and notices the thing that needs
 * correcting. Everything else in the feed is derived from what actually
 * happened and has no edit affordance at all - a stage move is a fact, not a
 * field.
 */
export function RecordTimeline({
  entries,
  isLoading,
  subjectId,
  subjectType,
  onFeedback,
}: RecordTimelineProps) {
  const queryClient = useQueryClient()
  const actorQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient<{ item: CurrentActor }>('/api/v1/me'),
  })
  const actorId = actorQuery.data?.item.id ?? null

  async function refresh(): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['timeline', subjectType, subjectId],
      }),
      queryClient.invalidateQueries({
        queryKey: ['activities', subjectType, subjectId],
      }),
    ])
  }

  if (isLoading) return <p className="work-state">Loading history…</p>
  if (entries.length === 0) {
    return <p className="work-empty">Nothing has happened yet.</p>
  }

  return (
    <div className="record-timeline">
      {entries.map((entry) => (
        <TimelineItem
          canEdit={actorId !== null && entry.actor?.id === actorId}
          entry={entry}
          key={entry.id}
          onEdited={refresh}
          onFeedback={onFeedback}
        />
      ))}
    </div>
  )
}
