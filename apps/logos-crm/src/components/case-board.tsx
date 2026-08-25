'use client'

import Link from 'next/link'
import { useMemo, useState, type DragEvent } from 'react'

import type { CaseRecord } from '@/contracts/case'
import type { PipelineKey, PipelineStage } from '@/contracts/pipeline'
import { getPipeline } from '@/contracts/pipeline'

import { StatusBadge } from './case-status'

export interface StageMove {
  id: string
  stage: string
  expectedVersion: number
}

interface CaseBoardProps {
  cases: readonly CaseRecord[]
  pipeline: PipelineKey
  isBusy: boolean
  onMove: (move: StageMove) => void
}

/**
 * A column whose stage is not in the catalogue. Cases land here when a stage is
 * retired or when an import carried a value the catalogue never had. It exists
 * so a case can never become invisible: a board that silently drops rows is
 * worse than one with an untidy column, because nobody goes looking for work
 * they cannot see.
 */
const UNMAPPED_COLUMN = 'unmapped'

interface BoardColumn {
  key: string
  label: string
  kind: PipelineStage['kind'] | 'unmapped'
  cases: CaseRecord[]
}

function buildColumns(
  pipeline: PipelineKey,
  items: readonly CaseRecord[]
): BoardColumn[] {
  const stages = getPipeline(pipeline).stages
  const byStage = new Map<string, CaseRecord[]>(
    stages.map((stage) => [stage.key, []])
  )
  const unmapped: CaseRecord[] = []

  for (const item of items) {
    const bucket = byStage.get(item.stage)
    if (bucket) bucket.push(item)
    else unmapped.push(item)
  }

  const columns: BoardColumn[] = stages.map((stage) => ({
    key: stage.key,
    label: stage.label,
    kind: stage.kind,
    cases: byStage.get(stage.key) ?? [],
  }))

  // Only rendered when it has something in it, so a healthy board is not
  // cluttered by a column that exists purely as a safety net.
  if (unmapped.length > 0) {
    columns.push({
      key: UNMAPPED_COLUMN,
      label: 'Unmapped stage',
      kind: 'unmapped',
      cases: unmapped,
    })
  }

  return columns
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

/**
 * Dragging is the fast path, not the only one. A pointer gesture is unusable by
 * keyboard and by most assistive technology, so the same move is offered as a
 * select on every card - which also makes the available stages discoverable
 * instead of something you learn by dropping a card and seeing what happens.
 */
function CaseCard({
  item,
  stages,
  onDragStart,
  onSelectStage,
}: {
  item: CaseRecord
  stages: readonly PipelineStage[]
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onSelectStage: (stage: string) => void
}) {
  const task = item.nextTask
  const isOverdue = task ? new Date(task.dueAt).getTime() < Date.now() : false

  return (
    <article
      className="board-card"
      data-priority={item.priority}
      draggable
      onDragStart={onDragStart}
    >
      <Link
        className="board-card-title cursor-pointer"
        href={`/cases/${item.id}`}
      >
        {item.title}
      </Link>
      <p className="board-card-org">
        {item.organisationName ?? 'No organisation'}
      </p>
      <p className="board-card-meta">
        <StatusBadge value={item.status} />
        <span>{item.owner?.displayName ?? 'Unassigned'}</span>
      </p>
      {task && (
        <p className={`board-card-task ${isOverdue ? 'due-overdue' : ''}`}>
          {task.title} · {formatDate(task.dueAt)}
        </p>
      )}
      <label className="board-card-move">
        <span className="visually-hidden">Move {item.title} to stage</span>
        <select
          value={item.stage}
          onChange={(event) => onSelectStage(event.target.value)}
        >
          {/* An unmapped stage is listed so the select has a value to show,
              and disabled so it cannot be chosen deliberately. */}
          {!stages.some((stage) => stage.key === item.stage) && (
            <option disabled value={item.stage}>
              {item.stage}
            </option>
          )}
          {stages.map((stage) => (
            <option key={stage.key} value={stage.key}>
              {stage.label}
            </option>
          ))}
        </select>
      </label>
    </article>
  )
}

export function CaseBoard({ cases, pipeline, isBusy, onMove }: CaseBoardProps) {
  const columns = useMemo(
    () => buildColumns(pipeline, cases),
    [pipeline, cases]
  )
  const stages = getPipeline(pipeline).stages
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)

  function handleDrop(event: DragEvent<HTMLElement>, stage: string): void {
    event.preventDefault()
    setOverStage(null)
    setDraggingId(null)

    // The unmapped column is a place cases arrive from, never one they can be
    // dropped into: it is not a stage, so there is nothing to record.
    if (stage === UNMAPPED_COLUMN) return

    const id = event.dataTransfer.getData('text/plain')
    const item = cases.find((entry) => entry.id === id)
    if (!item || item.stage === stage) return

    onMove({ id, stage, expectedVersion: item.version })
  }

  return (
    <div className="case-board" aria-busy={isBusy}>
      {columns.map((column) => (
        <section
          aria-label={column.label}
          className={`board-column ${overStage === column.key ? 'drop-target' : ''}`}
          data-kind={column.kind}
          key={column.key}
          onDragLeave={() => setOverStage(null)}
          onDragOver={(event) => {
            if (column.key === UNMAPPED_COLUMN) return
            // Preventing the default is what marks this a valid drop target;
            // without it the browser refuses the drop and the card snaps back.
            event.preventDefault()
            setOverStage(column.key)
          }}
          onDrop={(event) => handleDrop(event, column.key)}
        >
          <header className="board-column-header">
            <h3>{column.label}</h3>
            <b>{column.cases.length}</b>
          </header>

          <div className="board-column-body">
            {column.cases.map((item) => (
              <CaseCard
                item={item}
                key={item.id}
                stages={stages}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', item.id)
                  event.dataTransfer.effectAllowed = 'move'
                  setDraggingId(item.id)
                }}
                onSelectStage={(stage) => {
                  if (stage === item.stage) return
                  onMove({
                    id: item.id,
                    stage,
                    expectedVersion: item.version,
                  })
                }}
              />
            ))}

            {column.cases.length === 0 && (
              <p className="board-column-empty">
                {draggingId ? 'Drop here' : 'Nothing here'}
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
