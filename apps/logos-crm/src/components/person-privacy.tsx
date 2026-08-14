'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { PrivacyState, PrivacyRequestRecord } from '@/contracts/privacy'
import {
  privacyRequestStatusLabels,
  privacyRequestTypeLabels,
} from '@/contracts/privacy'
import { privacyRequestTypes } from '@/contracts/values'
import { apiClient } from '@/lib/api-client'

interface PersonPrivacyProps {
  id: string
}

type PrivacyAction =
  | { action: 'suppression'; doNotContact: boolean; reason?: string }
  | { action: 'request'; type: PrivacyRequestRecord['type'] }
  | { action: 'anonymise' }

export function PersonPrivacy({ id }: PersonPrivacyProps) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [confirmErase, setConfirmErase] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const privacyQuery = useQuery({
    queryKey: ['privacy', id],
    queryFn: () =>
      apiClient<{ item: PrivacyState }>(`/api/v1/people/${id}/privacy`),
  })

  const act = useMutation({
    mutationFn: (input: PrivacyAction) =>
      apiClient<{ item: PrivacyState }>(`/api/v1/people/${id}/privacy`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setReason('')
      setConfirmErase(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['privacy', id] }),
        queryClient.invalidateQueries({ queryKey: ['person', id] }),
      ])
    },
    onError: () => setFeedback('That could not be saved. Retry.'),
  })

  const state = privacyQuery.data?.item
  if (!state) return null

  return (
    <section className="report-card privacy-card">
      <div className="evaluation-header">
        <p className="utility-label">Personal data</p>
        {state.anonymisedAt && <span className="privacy-flag">Erased</span>}
      </div>

      <div className="privacy-suppression">
        <strong>
          {state.doNotContact ? 'Do not contact' : 'Contact allowed'}
        </strong>
        {state.doNotContactReason && <p>{state.doNotContactReason}</p>}

        {!state.doNotContact && (
          <label className="duplicate-reason">
            <span>Reason</span>
            <input
              maxLength={500}
              placeholder="Why are we stopping contact?"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        )}

        <div className="evaluation-decision-actions">
          <button
            className="work-text-action cursor-pointer"
            disabled={act.isPending}
            type="button"
            onClick={() =>
              act.mutate({
                action: 'suppression',
                doNotContact: !state.doNotContact,
                ...(reason.trim() ? { reason: reason.trim() } : {}),
              })
            }
          >
            {state.doNotContact ? 'Allow contact again' : 'Stop contacting'}
          </button>
        </div>
      </div>

      <div className="privacy-requests">
        <p className="utility-label">Requests</p>
        {state.requests.length === 0 ? (
          <p className="report-note">No requests recorded.</p>
        ) : (
          <ul className="search-hits">
            {state.requests.map((request) => (
              <li key={request.id}>
                <div className="duplicate-hit">
                  <div>
                    <strong>{privacyRequestTypeLabels[request.type]}</strong>
                    <span>
                      {privacyRequestStatusLabels[request.status]} ·{' '}
                      {new Date(request.receivedAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="evaluation-decision-actions">
          {privacyRequestTypes.map((type) => (
            <button
              className="work-text-action cursor-pointer"
              disabled={act.isPending}
              key={type}
              type="button"
              onClick={() => act.mutate({ action: 'request', type })}
            >
              Log {privacyRequestTypeLabels[type].toLocaleLowerCase('en')}
            </button>
          ))}
        </div>
      </div>

      {!state.anonymisedAt && (
        <div className="privacy-erase">
          <p className="report-note">
            Erasing removes the name and contact details and clears the stored
            submission. Cases, links, and the audit trail stay, so what was
            decided remains provable. It cannot be undone.
          </p>
          <div className="evaluation-decision-actions">
            {confirmErase ? (
              <>
                <button
                  className="work-text-action cursor-pointer"
                  disabled={act.isPending}
                  type="button"
                  onClick={() => act.mutate({ action: 'anonymise' })}
                >
                  Confirm erasure
                </button>
                <button
                  className="work-text-action cursor-pointer"
                  type="button"
                  onClick={() => setConfirmErase(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="work-text-action cursor-pointer"
                type="button"
                onClick={() => setConfirmErase(true)}
              >
                Erase personal data
              </button>
            )}
          </div>
        </div>
      )}

      {feedback && <p className="evaluation-feedback">{feedback}</p>}
    </section>
  )
}
