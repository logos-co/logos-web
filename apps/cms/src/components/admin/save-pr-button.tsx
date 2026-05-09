'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

type SaveResult = {
  branchName: string
  pullRequestNumber: number
  pullRequestUrl: string
  commitSha: string
  contentChangeRequestId: string | number
}

/**
 * Custom Admin field component rendered inside content-collection edit views.
 * Reads the current document id from Payload's `useDocumentInfo`, POSTs to
 * the configured workflow endpoint, and surfaces the resulting PR URL or
 * error inline.
 *
 * Editors must save the document first — the button only becomes active once
 * a doc id exists. To keep the trust boundary clear, the button never sends
 * the in-memory form state; the API route refetches by id so the PR always
 * reflects what's persisted in Payload.
 *
 * One factory per content type (`SaveRfpPrButton`, `SaveIdeaPrButton`, …)
 * binds the corresponding workflow route. Adding a new collection means
 * adding one more factory call below — no new component file.
 */
const createSavePrButton = ({ endpoint }: { endpoint: string }) =>
  function SavePrButton() {
    return <SavePrButtonInner endpoint={endpoint} />
  }

const SavePrButtonInner = ({ endpoint }: { endpoint: string }) => {
  const { id } = useDocumentInfo()
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<SaveResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const disabled = !id || pending

  const onClick = async () => {
    if (!id) return
    setPending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id }),
      })
      const json = (await res.json()) as Partial<SaveResult> & {
        error?: string
      }
      if (!res.ok) {
        setError(json.error ?? `request failed (${res.status})`)
        return
      }
      setResult(json as SaveResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 'var(--base, 24px)',
        padding: '16px',
        borderRadius: 6,
        border: '1px solid var(--theme-elevation-100, #e0e0e0)',
        background: 'var(--theme-elevation-50, #fafafa)',
      }}
    >
      <h4 style={{ margin: '0 0 8px 0' }}>Publish to repo</h4>
      <p style={{ margin: '0 0 12px 0', fontSize: 13, opacity: 0.8 }}>
        Saves the current values to a fresh <code>content/...</code> branch on
        GitHub and opens a draft pull request. The web app will reflect the
        change once the PR merges.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          padding: '8px 16px',
          borderRadius: 4,
          border: '1px solid currentColor',
          background: pending ? 'transparent' : 'var(--theme-text, #111)',
          color: pending ? 'var(--theme-text, #111)' : 'var(--theme-bg, #fff)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          fontWeight: 600,
        }}
      >
        {pending ? 'Creating PR…' : 'Create PR'}
      </button>

      {!id ? (
        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          Save the draft first — the PR action needs a stored document.
        </p>
      ) : null}

      {error ? (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--theme-error-50, #fdecec)',
            color: 'var(--theme-error-700, #b00020)',
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            fontSize: 12,
          }}
        >
          {error}
        </pre>
      ) : null}

      {result ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--theme-success-50, #e6f4ea)',
            color: 'var(--theme-success-700, #1e6b3a)',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          PR opened:{' '}
          <a
            href={result.pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 600 }}
          >
            #{result.pullRequestNumber}
          </a>
          <br />
          branch: <code>{result.branchName}</code>
        </div>
      ) : null}
    </div>
  )
}

export const SaveRfpPrButton = createSavePrButton({
  endpoint: '/api/content-workflow/save-rfp-as-pr',
})

export const SaveIdeaPrButton = createSavePrButton({
  endpoint: '/api/content-workflow/save-idea-as-pr',
})

export const SaveCirclePrButton = createSavePrButton({
  endpoint: '/api/content-workflow/save-circle-as-pr',
})

export const SaveCircleEventPrButton = createSavePrButton({
  endpoint: '/api/content-workflow/save-circle-event-as-pr',
})

export const SaveCircleInitiativePrButton = createSavePrButton({
  endpoint: '/api/content-workflow/save-circle-initiative-as-pr',
})

export default SaveRfpPrButton
