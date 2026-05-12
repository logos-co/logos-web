'use client'

import { useFormFields } from '@payloadcms/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'

type RecentPullRequest = {
  id: string | number
  branchName?: string | null
  contentType?: string | null
  pullRequestNumber?: number | null
  pullRequestUrl?: string | null
  status?: string | null
  updatedAt?: string | null
}

type RecentPrResult = {
  pullRequests: RecentPullRequest[]
  error?: string
}

type MergePrResult = {
  contentChangeRequestId?: string | number
  error?: string
  merged?: boolean
  message?: string
  pullRequestNumber?: number
  pullRequestUrl?: string
  sha?: string | null
}

const COLLECTION_LABELS: Record<string, string> = {
  circles: 'Circle',
  'circle-events': 'Circle event',
  'circle-initiatives': 'Circle initiative',
  'circle-resources': 'Circle resource',
  ideas: 'Idea',
  rfps: 'RFP',
}

const useCollectionSlug = (): string | null =>
  useMemo(() => {
    if (typeof window === 'undefined') return null
    const match = window.location.pathname.match(/\/collections\/([^/]+)/)
    return match?.[1] ? decodeURIComponent(match[1]) : null
  }, [])

const useFormSlug = (): string | undefined =>
  useFormFields(([fields]) => {
    const field = fields?.['slug']
    return typeof field?.value === 'string' ? field.value : undefined
  })

const buildHref = ({
  collection,
  slug,
}: {
  collection: string
  slug?: string
}): string => {
  const params = new URLSearchParams({ collection })
  if (slug) params.set('slug', slug)
  return `/api/content-workflow/recent-pr?${params.toString()}`
}

const buildDismissKey = ({
  collection,
  pullRequests,
  scope,
  slug,
}: {
  collection: string
  pullRequests: RecentPullRequest[]
  scope: 'document' | 'list'
  slug?: string
}): string => {
  const ids = pullRequests.map((pr) => pr.id).join(',')
  return `recent-pr-banner:${collection}:${scope}:${slug ?? 'list'}:${ids}`
}

const RecentPrBannerInner = ({
  scope,
  slug,
}: {
  scope: 'document' | 'list'
  slug?: string
}) => {
  const collection = useCollectionSlug()
  const [result, setResult] = useState<RecentPrResult | null>(null)
  const [pending, setPending] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mergeError, setMergeError] = useState<string | null>(null)
  const [mergedPr, setMergedPr] = useState<MergePrResult | null>(null)
  const [mergingPr, setMergingPr] = useState<number | null>(null)

  const dismissKey = useMemo(() => {
    if (!collection || !result || result.pullRequests.length === 0) return null
    return buildDismissKey({
      collection,
      pullRequests: result.pullRequests,
      scope,
      slug,
    })
  }, [collection, result, scope, slug])

  useEffect(() => {
    if (!collection || !COLLECTION_LABELS[collection]) return

    let cancelled = false
    setPending(true)
    setDismissed(false)
    void fetch(buildHref({ collection, slug }), {
      credentials: 'same-origin',
    })
      .then(async (res) => {
        const json = (await res.json()) as RecentPrResult
        if (cancelled) return
        setResult(
          res.ok
            ? json
            : {
                pullRequests: [],
                error: json.error ?? `request failed (${res.status})`,
              }
        )
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({
            pullRequests: [],
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })
      .finally(() => {
        if (!cancelled) setPending(false)
      })

    return () => {
      cancelled = true
    }
  }, [collection, slug])

  useEffect(() => {
    if (!dismissKey) return
    setDismissed(window.sessionStorage.getItem(dismissKey) === 'true')
  }, [dismissKey])

  const onDismiss = useCallback(() => {
    if (dismissKey) {
      window.sessionStorage.setItem(dismissKey, 'true')
    }
    setDismissed(true)
  }, [dismissKey])

  const onMerge = useCallback(async (pullRequestNumber?: number | null) => {
    if (!pullRequestNumber) return

    setMergeError(null)
    setMergedPr(null)
    setMergingPr(pullRequestNumber)
    try {
      const response = await fetch('/api/content-workflow/merge-pr', {
        body: JSON.stringify({ pullRequestNumber }),
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const json = (await response.json()) as MergePrResult
      if (!response.ok) {
        throw new Error(json.error ?? `request failed (${response.status})`)
      }
      setMergedPr(json)

      setResult((current) =>
        current
          ? {
              ...current,
              pullRequests: current.pullRequests.filter(
                (pr) => pr.pullRequestNumber !== pullRequestNumber
              ),
            }
          : current
      )
    } catch (error) {
      setMergeError(error instanceof Error ? error.message : String(error))
    } finally {
      setMergingPr(null)
    }
  }, [])

  if (!collection || !COLLECTION_LABELS[collection]) return null
  if (pending || !result) return null
  if (result.pullRequests.length === 0 && !mergedPr) return null
  if (dismissed) return null

  const label = COLLECTION_LABELS[collection]
  return (
    <div
      style={{
        marginBottom: 'var(--base, 16px)',
        padding: '12px 52px 12px 16px',
        position: 'relative',
        borderRadius: 6,
        border: '1px solid var(--theme-success-300, #88d39f)',
        background: 'var(--theme-success-50, #e6f4ea)',
        color: 'var(--theme-success-800, #155724)',
        fontSize: 13,
      }}
    >
      <strong>
        {scope === 'document' ? `Latest ${label} PR` : `Recent ${label} PRs`}
      </strong>
      <button
        type="button"
        aria-label="Dismiss recent PR banner"
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          border: '1px solid var(--theme-success-300, #88d39f)',
          borderRadius: '50%',
          background: 'var(--theme-bg, #fff)',
          color: 'var(--theme-success-800, #155724)',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: '24px',
          padding: 0,
        }}
      >
        ×
      </button>
      {result.error ? (
        <div style={{ marginTop: 6 }}>PR lookup failed: {result.error}</div>
      ) : null}
      {mergeError ? (
        <div style={{ marginTop: 6 }}>PR merge failed: {mergeError}</div>
      ) : null}
      {mergedPr?.pullRequestUrl ? (
        <div style={{ marginTop: 8 }}>
          Merged:{' '}
          <a
            href={mergedPr.pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 700 }}
          >
            PR #{mergedPr.pullRequestNumber ?? '?'}
          </a>
        </div>
      ) : null}
      {result.pullRequests.length > 0 ? (
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
          {result.pullRequests.map((pr) => (
            <li key={pr.id} style={{ marginBottom: 4 }}>
              <span
                style={{
                  alignItems: 'center',
                  display: 'inline-flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <a
                  href={pr.pullRequestUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700 }}
                >
                  PR #{pr.pullRequestNumber ?? '?'}
                </a>
                <span style={{ opacity: 0.78 }}>
                  <code>{pr.branchName}</code>
                </span>
                <button
                  type="button"
                  disabled={
                    !pr.pullRequestNumber || mergingPr === pr.pullRequestNumber
                  }
                  onClick={() => void onMerge(pr.pullRequestNumber)}
                  style={{
                    border: '1px solid var(--theme-success-300, #88d39f)',
                    borderRadius: 4,
                    background: 'var(--theme-bg, #fff)',
                    color: 'var(--theme-success-800, #155724)',
                    cursor:
                      !pr.pullRequestNumber ||
                      mergingPr === pr.pullRequestNumber
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 8px',
                  }}
                >
                  {mergingPr === pr.pullRequestNumber
                    ? 'Merging...'
                    : 'Merge to develop'}
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export const RecentDocumentPrBanner = () => {
  const slug = useFormSlug()
  return <RecentPrBannerInner scope="document" slug={slug} />
}

export const RecentCollectionPrBanner = () => (
  <RecentPrBannerInner scope="list" />
)

export default RecentDocumentPrBanner
