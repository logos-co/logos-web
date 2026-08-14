'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { CreateExportInput, ExportJobRecord } from '@/contracts/export'
import { apiClient } from '@/lib/api-client'

interface ExportButtonProps {
  request: CreateExportInput
  label?: string
}

/** How often to ask whether the worker has finished the file. */
const POLL_INTERVAL_MS = 1_500

export function ExportButton({
  request,
  label = 'Export CSV',
}: ExportButtonProps) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const start = useMutation({
    mutationFn: () =>
      apiClient<{ item: ExportJobRecord }>('/api/v1/exports', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: ({ item }) => setJobId(item.id),
    onError: () => setFeedback('The export could not be started.'),
  })

  const job = useQuery({
    queryKey: ['export', jobId],
    queryFn: () =>
      apiClient<{ item: ExportJobRecord }>(`/api/v1/exports/${jobId}`),
    enabled: Boolean(jobId),
    // Stops polling once the worker has settled the job either way.
    refetchInterval: (query) => {
      const status = query.state.data?.item.status
      return status === 'completed' || status === 'failed'
        ? false
        : POLL_INTERVAL_MS
    },
  })

  const status = job.data?.item.status

  return (
    <div className="export-control">
      {status === 'completed' && jobId ? (
        <a
          className="work-text-action cursor-pointer"
          href={`/api/v1/exports/${jobId}/download`}
        >
          Download ({job.data?.item.rowCount ?? 0} rows)
        </a>
      ) : (
        <button
          className="work-text-action cursor-pointer"
          disabled={start.isPending || (Boolean(jobId) && status !== 'failed')}
          type="button"
          onClick={() => start.mutate()}
        >
          {status === 'failed' ? 'Retry export' : jobId ? 'Preparing…' : label}
        </button>
      )}

      {feedback && <span className="report-note">{feedback}</span>}
    </div>
  )
}
