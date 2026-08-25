'use client'

import { Button } from '@acid-info/logos-ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import type {
  ActivityRecord,
  CreateActivityInput,
  CreateTaskInput,
  TaskPriority,
  TaskRecord,
  TaskStatus,
  WorkSubjectType,
} from '@/contracts/work'
import type { TimelineEntry } from '@/contracts/timeline'
import type { UserRecord } from '@/contracts/user'
import { apiClient } from '@/lib/api-client'

import { RecordTimeline } from './record-timeline'
import { RichTextEditor } from './rich-text-editor'
import { RichTextView } from './rich-text-view'

interface WorkResponse<T> {
  items: T[]
}

interface RecordWorkProps {
  subjectId: string
  subjectType: WorkSubjectType
}

const activityLabels: Record<ActivityRecord['type'], string> = {
  note: 'Note',
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
}

function defaultDueDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatWorkDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function RecordWork({ subjectId, subjectType }: RecordWorkProps) {
  const queryClient = useQueryClient()
  const queryKey = [subjectType, subjectId]
  const [note, setNote] = useState('')
  const [isAddingTask, setAddingTask] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [assigneeUserId, setAssigneeUserId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState(defaultDueDate)
  /**
   * History is the default panel. "What has happened with this partner" was
   * previously answered by reading two tabs and inferring the order between
   * them, which is the gap the merged timeline closes - so it is what the
   * record opens on.
   */
  const [activeLedger, setActiveLedger] = useState<
    'history' | 'tasks' | 'activity'
  >('history')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    setNote('')
    setAddingTask(false)
    setTaskTitle('')
    setAssigneeUserId('')
    setPriority('medium')
    setDueDate(defaultDueDate())
    setActiveLedger('history')
    setFeedback(null)
  }, [subjectId, subjectType])

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient<WorkResponse<UserRecord>>('/api/v1/users'),
  })
  const users = usersQuery.data?.items ?? []

  const activitiesQuery = useQuery({
    queryKey: ['activities', ...queryKey],
    queryFn: () =>
      apiClient<WorkResponse<ActivityRecord>>(
        `/api/v1/activities?subjectType=${subjectType}&subjectId=${subjectId}`
      ),
  })

  const timelineQuery = useQuery({
    queryKey: ['timeline', ...queryKey],
    queryFn: () =>
      apiClient<WorkResponse<TimelineEntry>>(
        `/api/v1/timeline?subjectType=${subjectType}&subjectId=${subjectId}`
      ),
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks', ...queryKey],
    queryFn: () =>
      apiClient<WorkResponse<TaskRecord>>(
        `/api/v1/tasks?subjectType=${subjectType}&subjectId=${subjectId}`
      ),
  })

  const createActivityMutation = useMutation({
    mutationFn: (input: CreateActivityInput) =>
      apiClient<{ item: ActivityRecord }>('/api/v1/activities', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setNote('')
      setFeedback('Note recorded.')
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['activities', ...queryKey],
        }),
        queryClient.invalidateQueries({ queryKey: ['timeline', ...queryKey] }),
      ])
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: (input: CreateTaskInput) =>
      apiClient<{ item: TaskRecord }>('/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setTaskTitle('')
      setAddingTask(false)
      setFeedback('Task added.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks', ...queryKey] }),
        queryClient.invalidateQueries({ queryKey: ['timeline', ...queryKey] }),
      ])
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiClient<{ item: TaskRecord }>(`/api/v1/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      setFeedback('Task updated.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks', ...queryKey] }),
        queryClient.invalidateQueries({ queryKey: ['timeline', ...queryKey] }),
      ])
    },
  })

  const taskItems = tasksQuery.data?.items ?? []
  const openTasks = taskItems.filter((item) => item.status === 'open')
  const finishedTasks = taskItems.filter((item) => item.status !== 'open')
  const activities = activitiesQuery.data?.items ?? []
  const hasError =
    activitiesQuery.isError ||
    tasksQuery.isError ||
    createActivityMutation.isError ||
    createTaskMutation.isError ||
    updateTaskMutation.isError

  return (
    <div className="record-work">
      <div className="work-tabs" aria-label="Record work" role="tablist">
        <button
          aria-selected={activeLedger === 'history'}
          className="cursor-pointer"
          role="tab"
          type="button"
          onClick={() => setActiveLedger('history')}
        >
          History <span>{timelineQuery.data?.items.length ?? 0}</span>
        </button>
        <button
          aria-selected={activeLedger === 'tasks'}
          className="cursor-pointer"
          role="tab"
          type="button"
          onClick={() => setActiveLedger('tasks')}
        >
          Tasks <span>{openTasks.length}</span>
        </button>
        <button
          aria-selected={activeLedger === 'activity'}
          className="cursor-pointer"
          role="tab"
          type="button"
          onClick={() => setActiveLedger('activity')}
        >
          Activity <span>{activities.length}</span>
        </button>
      </div>

      {activeLedger === 'history' && (
        <section className="history-ledger" role="tabpanel">
          <RecordTimeline
            entries={timelineQuery.data?.items ?? []}
            isLoading={timelineQuery.isLoading}
            subjectId={subjectId}
            subjectType={subjectType}
            onFeedback={setFeedback}
          />
        </section>
      )}

      {activeLedger === 'tasks' && (
        <section className="task-ledger" role="tabpanel">
          <div className="work-section-heading">
            <div>
              <p className="utility-label">Tasks</p>
              <strong>{openTasks.length} open</strong>
            </div>
            <button
              className="work-text-action cursor-pointer"
              type="button"
              onClick={() => setAddingTask((value) => !value)}
            >
              {isAddingTask ? 'Cancel' : 'Add task'}
            </button>
          </div>

          {isAddingTask && (
            <form
              className="work-form task-form"
              onSubmit={(event) => {
                event.preventDefault()
                createTaskMutation.mutate({
                  subjectType,
                  subjectId,
                  title: taskTitle,
                  ...(assigneeUserId ? { assigneeUserId } : {}),
                  priority,
                  dueAt: new Date(`${dueDate}T17:00:00`).toISOString(),
                })
              }}
            >
              <label>
                <span>Task</span>
                <input
                  required
                  minLength={2}
                  maxLength={180}
                  placeholder="What needs to happen?"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                />
              </label>
              <div className="work-form-row">
                <label>
                  <span>Assignee</span>
                  <select
                    value={assigneeUserId}
                    onChange={(event) => setAssigneeUserId(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Due</span>
                  <input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </label>
              </div>
              <label>
                <span>Priority</span>
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as TaskPriority)
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <Button
                className="cursor-pointer"
                disabled={createTaskMutation.isPending}
                type="submit"
              >
                {createTaskMutation.isPending ? 'Saving…' : 'Save task'}
              </Button>
            </form>
          )}

          <div className="task-list">
            {openTasks.map((task) => (
              <TaskItem
                item={task}
                key={task.id}
                isUpdating={updateTaskMutation.isPending}
                onStatusChange={(status) =>
                  updateTaskMutation.mutate({ id: task.id, status })
                }
              />
            ))}
            {openTasks.length === 0 && !tasksQuery.isLoading && (
              <p className="work-empty">No open tasks. Add the next action.</p>
            )}
            {finishedTasks.length > 0 && (
              <details className="finished-tasks">
                <summary className="cursor-pointer">
                  {finishedTasks.length} finished
                </summary>
                {finishedTasks.map((task) => (
                  <TaskItem
                    item={task}
                    key={task.id}
                    isUpdating={updateTaskMutation.isPending}
                    onStatusChange={(status) =>
                      updateTaskMutation.mutate({ id: task.id, status })
                    }
                  />
                ))}
              </details>
            )}
          </div>
        </section>
      )}

      {activeLedger === 'activity' && (
        <section className="activity-ledger" role="tabpanel">
          <div className="work-section-heading">
            <div>
              <p className="utility-label">Activity</p>
              <strong>
                {activities.length}{' '}
                {activities.length === 1 ? 'entry' : 'entries'}
              </strong>
            </div>
          </div>

          <form
            className="work-form note-form"
            onSubmit={(event) => {
              event.preventDefault()
              createActivityMutation.mutate({
                subjectType,
                subjectId,
                type: 'note',
                body: note,
              })
            }}
          >
            <label>
              <span>Add note</span>
            </label>
            <RichTextEditor
              label="Note body"
              placeholder="Record context for the next coordinator. **Bold**, - lists, and [links](https://) work."
              value={note}
              onChange={setNote}
            />
            <button
              className="work-text-action cursor-pointer"
              disabled={createActivityMutation.isPending || !note.trim()}
              type="submit"
            >
              {createActivityMutation.isPending ? 'Saving…' : 'Record note'}
            </button>
          </form>

          <div className="activity-timeline">
            {activities.map((activity) => (
              <article key={activity.id}>
                <span className={`activity-mark activity-${activity.type}`} />
                <div>
                  <p>
                    <strong>{activityLabels[activity.type]}</strong>
                    <time>{formatWorkDate(activity.occurredAt)}</time>
                  </p>
                  {activity.isDeleted ? (
                    <p className="timeline-deleted">This note was deleted.</p>
                  ) : (
                    <RichTextView body={activity.body} />
                  )}
                  <small>
                    {activity.createdBy.displayName}
                    {activity.editedAt ? ' · edited' : ''}
                  </small>
                </div>
              </article>
            ))}
            {activities.length === 0 && !activitiesQuery.isLoading && (
              <p className="work-empty">No activity recorded yet.</p>
            )}
          </div>
        </section>
      )}

      {(tasksQuery.isLoading || activitiesQuery.isLoading) && (
        <p className="work-state">Loading work history…</p>
      )}
      {hasError && (
        <p className="work-state work-error" role="alert">
          The work history could not be updated. Check the record and retry.
        </p>
      )}
      {feedback && !hasError && (
        <p className="work-state work-success" role="status">
          {feedback}
        </p>
      )}
    </div>
  )
}

function TaskItem({
  isUpdating,
  item,
  onStatusChange,
}: {
  isUpdating: boolean
  item: TaskRecord
  onStatusChange: (status: TaskStatus) => void
}) {
  const isOpen = item.status === 'open'

  return (
    <article className={`task-item ${isOpen ? '' : 'task-finished'}`}>
      <button
        aria-label={isOpen ? `Complete ${item.title}` : `Reopen ${item.title}`}
        className="task-toggle cursor-pointer"
        disabled={isUpdating}
        type="button"
        onClick={() => onStatusChange(isOpen ? 'completed' : 'open')}
      >
        {isOpen ? '' : '✓'}
      </button>
      <div>
        <strong>{item.title}</strong>
        <span>
          {item.assignee?.displayName ?? 'Unassigned'} · Due{' '}
          {formatWorkDate(item.dueAt)}
        </span>
      </div>
      <i className={`task-priority task-priority-${item.priority}`}>
        {item.priority}
      </i>
    </article>
  )
}
