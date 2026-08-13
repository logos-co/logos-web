'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { CaseRecord } from '@/contracts/case'
import type {
  CaseDecision,
  EvaluationStage,
  EvaluationSummary,
} from '@/contracts/evaluation'
import {
  caseDecisionLabels,
  evaluationStageLabels,
} from '@/contracts/evaluation'
import {
  evaluationStages,
  EVALUATION_SCORE_MAX,
  EVALUATION_SCORE_MIN,
} from '@/contracts/values'
import { apiClient } from '@/lib/api-client'

interface CaseEvaluationProps {
  item: CaseRecord
}

const scoreOptions = Array.from(
  { length: EVALUATION_SCORE_MAX - EVALUATION_SCORE_MIN + 1 },
  (_, index) => EVALUATION_SCORE_MIN + index
)

const decisionOptions: ReadonlyArray<Exclude<CaseDecision, 'pending'>> = [
  'approved',
  'redirected',
  'declined',
]

export function CaseEvaluation({ item }: CaseEvaluationProps) {
  const queryClient = useQueryClient()
  const [openStage, setOpenStage] = useState<EvaluationStage | null>(null)
  const [score, setScore] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [decisionReason, setDecisionReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const evaluationQuery = useQuery({
    queryKey: ['evaluations', item.id],
    queryFn: () =>
      apiClient<{ item: EvaluationSummary }>(
        `/api/v1/cases/${item.id}/evaluations`
      ),
  })

  const summary = evaluationQuery.data?.item
  const byStage = new Map(
    (summary?.stages ?? []).map((stage) => [stage.stage, stage])
  )

  const saveEvaluation = useMutation({
    mutationFn: (input: {
      stage: EvaluationStage
      score: number | null
      notes: string | null
    }) =>
      apiClient<{ item: EvaluationSummary }>(
        `/api/v1/cases/${item.id}/evaluations`,
        { method: 'PUT', body: JSON.stringify(input) }
      ),
    onSuccess: async () => {
      setOpenStage(null)
      setScore('')
      setNotes('')
      await queryClient.invalidateQueries({
        queryKey: ['evaluations', item.id],
      })
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
    onError: () => setFeedback('The evaluation could not be saved. Retry.'),
  })

  const saveDecision = useMutation({
    mutationFn: (decision: CaseDecision) =>
      apiClient<{ item: CaseRecord }>(`/api/v1/cases/${item.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          reason: decisionReason,
          expectedVersion: item.version,
        }),
      }),
    onSuccess: async () => {
      setDecisionReason('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['case', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
    onError: () => setFeedback('The decision could not be saved. Retry.'),
  })

  function startEditing(stage: EvaluationStage) {
    const existing = byStage.get(stage)
    setOpenStage(stage)
    setScore(existing?.score ? String(existing.score) : '')
    setNotes(existing?.notes ?? '')
  }

  return (
    <section className="record-facts-card evaluation-card">
      <div className="evaluation-header">
        <p className="utility-label">Evaluation</p>
        <span className="evaluation-average">
          {summary?.averageScore !== null && summary?.averageScore !== undefined
            ? summary.averageScore.toFixed(2)
            : '—'}
          <small>{summary ? `${summary.scoredCount} scored` : 'Loading'}</small>
        </span>
      </div>

      <ol className="evaluation-stages">
        {evaluationStages.map((stage) => {
          const recorded = byStage.get(stage)
          const isEditing = openStage === stage

          return (
            <li className="evaluation-stage" key={stage}>
              <div className="evaluation-stage-head">
                <strong>{evaluationStageLabels[stage]}</strong>
                <span className="evaluation-score">
                  {recorded?.score ?? '—'}
                </span>
                <button
                  className="work-text-action cursor-pointer"
                  type="button"
                  onClick={() =>
                    isEditing ? setOpenStage(null) : startEditing(stage)
                  }
                >
                  {isEditing ? 'Cancel' : recorded ? 'Edit' : 'Record'}
                </button>
              </div>

              {recorded && !isEditing && (
                <div className="evaluation-recorded">
                  {recorded.notes && <p>{recorded.notes}</p>}
                  <small>
                    {recorded.reviewer?.displayName ?? 'Unknown reviewer'} ·{' '}
                    {recorded.criteriaVersion}
                  </small>
                </div>
              )}

              {isEditing && (
                <form
                  className="work-form evaluation-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveEvaluation.mutate({
                      stage,
                      score: score ? Number(score) : null,
                      notes: notes || null,
                    })
                  }}
                >
                  <label>
                    <span>Score</span>
                    <select
                      value={score}
                      onChange={(event) => setScore(event.target.value)}
                    >
                      <option value="">Not scored</option>
                      {scoreOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Notes</span>
                    <textarea
                      maxLength={5_000}
                      placeholder="What did this stage show?"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </label>
                  <button
                    className="work-text-action cursor-pointer"
                    disabled={saveEvaluation.isPending}
                    type="submit"
                  >
                    {saveEvaluation.isPending ? 'Saving…' : 'Save stage'}
                  </button>
                </form>
              )}
            </li>
          )
        })}
      </ol>

      <div className="evaluation-decision">
        <p className="utility-label">Decision</p>
        <strong>{caseDecisionLabels[item.decision]}</strong>
        {item.decisionReason && <p>{item.decisionReason}</p>}

        {item.decision === 'pending' && (
          <>
            <label>
              <span>Reason</span>
              <input
                maxLength={1_000}
                placeholder="Why this outcome?"
                value={decisionReason}
                onChange={(event) => setDecisionReason(event.target.value)}
              />
            </label>
            <div className="evaluation-decision-actions">
              {decisionOptions.map((decision) => (
                <button
                  className="work-text-action cursor-pointer"
                  // A decision without a reason is the answer applicants ask
                  // about six months later, so the reason gates the button.
                  disabled={!decisionReason.trim() || saveDecision.isPending}
                  key={decision}
                  type="button"
                  onClick={() => saveDecision.mutate(decision)}
                >
                  {caseDecisionLabels[decision]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {feedback && (
        <p className="evaluation-feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  )
}
