'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { DuplicateSuggestion } from '@/contracts/merge'
import { duplicateReasonLabels } from '@/contracts/merge'
import { apiClient } from '@/lib/api-client'

interface DuplicateSuggestionsProps {
  id: string
  kind: 'people' | 'organisations'
}

export function DuplicateSuggestions({ id, kind }: DuplicateSuggestionsProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const suggestionsQuery = useQuery({
    queryKey: ['duplicates', kind, id],
    queryFn: () =>
      apiClient<{ items: DuplicateSuggestion[] }>(
        `/api/v1/${kind}/${id}/duplicate-suggestions`
      ),
  })

  const merge = useMutation({
    mutationFn: (duplicateId: string) =>
      apiClient<{ item: { survivorId: string } }>(`/api/v1/${kind}/merge`, {
        method: 'POST',
        body: JSON.stringify({
          survivorId: id,
          duplicateId,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      }),
    onSuccess: async () => {
      setReason('')
      await queryClient.invalidateQueries({
        queryKey: ['duplicates', kind, id],
      })
      router.refresh()
    },
    onError: () => setFeedback('The merge could not be completed. Retry.'),
  })

  const suggestions = suggestionsQuery.data?.items ?? []

  // Nothing to review is the normal state; an empty card every time would be
  // noise on every record anyone opens.
  if (suggestions.length === 0) return null

  return (
    <section className="report-card duplicate-card">
      <p className="utility-label">Possible duplicates</p>
      <p className="report-note">
        Merging moves links to this record and archives the other. It is not
        undone automatically.
      </p>

      <label className="duplicate-reason">
        <span>Reason</span>
        <input
          maxLength={500}
          placeholder="Why are these the same?"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>

      <ul className="search-hits">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <div className="duplicate-hit">
              <div>
                <strong>{suggestion.title}</strong>
                <span>
                  {duplicateReasonLabels[suggestion.reason]}
                  {suggestion.subtitle ? ` · ${suggestion.subtitle}` : ''}
                </span>
              </div>
              <button
                className="work-text-action cursor-pointer"
                disabled={merge.isPending}
                type="button"
                onClick={() => merge.mutate(suggestion.id)}
              >
                Merge into this record
              </button>
            </div>
          </li>
        ))}
      </ul>

      {feedback && <p className="evaluation-feedback">{feedback}</p>}
    </section>
  )
}
