'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import type { CreateExportInput, ExportJobRecord } from '@/contracts/export'
import { apiClient } from '@/lib/api-client'

interface ExportButtonProps {
  request: CreateExportInput
  label?: string
}

/**
 * Requests an extract and downloads it.
 *
 * Two steps rather than one link: the request is recorded server-side with the
 * actor and the filters before anything is produced, and a plain link would
 * make that record a side effect of a GET. There is nothing to wait for in
 * between, so the browser is sent to the file as soon as the request is
 * written.
 */
export function ExportButton({
  request,
  label = 'Export CSV',
}: ExportButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null)

  const start = useMutation({
    mutationFn: () =>
      apiClient<{ item: ExportJobRecord }>('/api/v1/exports', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: ({ item }) => {
      setFeedback(null)
      window.location.assign(`/api/v1/exports/${item.id}/download`)
    },
    onError: () => setFeedback('The export could not be produced.'),
  })

  return (
    <div className="export-control">
      <button
        className="work-text-action cursor-pointer"
        disabled={start.isPending}
        type="button"
        onClick={() => start.mutate()}
      >
        {start.isPending ? 'Preparing' : label}
      </button>

      {feedback && <span className="report-note">{feedback}</span>}
    </div>
  )
}
