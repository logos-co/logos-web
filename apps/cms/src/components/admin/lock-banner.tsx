'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type PullRequestSummary = {
  number: number
  htmlUrl: string
  state: string
  branchName: string
  title?: string
  author?: string | null
}

type LockResult = {
  pullRequests: PullRequestSummary[]
  changeRequests: Array<{
    id: string | number
    branchName: string
    pullRequestNumber: number | null
    pullRequestUrl: string | null
    status: string
    updatedAt: string
  }>
}

const buildTargetPath = (
  contentDir: string,
  slug: string | undefined
): string | null => {
  if (!slug) return null
  return `${contentDir}/${slug}/index.json`
}

/**
 * Custom Admin field component that surfaces the in-flight PR state for the
 * record currently being edited. Polls `/api/content-workflow/lock` once on
 * mount (and whenever the slug changes) and renders a yellow banner with
 * the open PR link if one exists.
 *
 * The banner is informational only — it does not block edits. Editors can
 * still save drafts to Payload while a PR is in flight; saving a *second*
 * PR for the same slug just creates a new branch.
 *
 * One factory per content directory binds the canonical fixture path:
 * `content/builders-hub/rfps/<slug>/index.json` for Rfps,
 * `content/builders-hub/ideas/<slug>/index.json` for Ideas, etc.
 */
const createLockBanner = ({ contentDir }: { contentDir: string }) =>
  function LockBanner() {
    return <LockBannerInner contentDir={contentDir} />
  }

const LockBannerInner = ({ contentDir }: { contentDir: string }) => {
  const { id } = useDocumentInfo()
  // Read the slug field from the live form state so the banner refreshes when
  // the editor renames the slug (rare but possible during create flow).
  const slug = useFormFields(([fields]) => {
    const f = fields?.['slug']
    return typeof f?.value === 'string' ? f.value : undefined
  })

  const targetPath = buildTargetPath(contentDir, slug)
  const [lock, setLock] = useState<LockResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!id || !targetPath) {
      setLock(null)
      return
    }
    let cancelled = false
    setPending(true)
    setError(null)
    void fetch(
      `/api/content-workflow/lock?path=${encodeURIComponent(targetPath)}`,
      {
        credentials: 'same-origin',
      }
    )
      .then(async (res) => {
        const json = (await res.json()) as Partial<LockResult> & {
          error?: string
        }
        if (cancelled) return
        if (!res.ok) {
          setError(json.error ?? `request failed (${res.status})`)
          setLock(null)
          return
        }
        setLock(json as LockResult)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setPending(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, targetPath])

  // Brand-new doc with no slug yet: render nothing.
  if (!id || !targetPath) return null

  if (pending) {
    return (
      <BannerShell tone="muted">
        Checking for in-flight pull requests…
      </BannerShell>
    )
  }

  if (error) {
    return (
      <BannerShell tone="error">
        Lock check failed: <code>{error}</code>
      </BannerShell>
    )
  }

  if (!lock || lock.pullRequests.length === 0) {
    return (
      <BannerShell tone="muted">
        No in-flight pull requests for <code>{targetPath}</code>.
      </BannerShell>
    )
  }

  return (
    <BannerShell tone="warn">
      <strong>
        {lock.pullRequests.length === 1
          ? '1 pull request is currently in flight'
          : `${lock.pullRequests.length} pull requests are currently in flight`}{' '}
        for this record:
      </strong>
      <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
        {lock.pullRequests.map((pr) => (
          <li key={pr.number} style={{ marginBottom: 4 }}>
            <a
              href={pr.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600 }}
            >
              #{pr.number}
            </a>{' '}
            <span style={{ opacity: 0.75 }}>
              ({pr.state}
              {pr.author ? ` · @${pr.author}` : ''} ·{' '}
              <code>{pr.branchName}</code>)
            </span>
            {pr.title ? (
              <div style={{ fontSize: 12, opacity: 0.8 }}>{pr.title}</div>
            ) : null}
          </li>
        ))}
      </ul>
      <p style={{ margin: '8px 0 0 0', fontSize: 12, opacity: 0.8 }}>
        Saving will open a separate branch. Coordinate with the other editor or
        wait for the existing PR to merge / close.
      </p>
    </BannerShell>
  )
}

const BannerShell = ({
  tone,
  children,
}: {
  tone: 'muted' | 'warn' | 'error'
  children: React.ReactNode
}) => {
  const palette = {
    muted: {
      bg: 'var(--theme-elevation-50, #fafafa)',
      border: 'var(--theme-elevation-100, #e0e0e0)',
      color: 'var(--theme-text, #111)',
    },
    warn: {
      bg: 'var(--theme-warning-50, #fff8e1)',
      border: 'var(--theme-warning-300, #ffd54f)',
      color: 'var(--theme-warning-800, #6b4f00)',
    },
    error: {
      bg: 'var(--theme-error-50, #fdecec)',
      border: 'var(--theme-error-300, #f5a3a3)',
      color: 'var(--theme-error-700, #b00020)',
    },
  }[tone]

  return (
    <div
      style={{
        marginBottom: 'var(--base, 16px)',
        padding: '12px 16px',
        borderRadius: 6,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  )
}

export const RfpLockBanner = createLockBanner({
  contentDir: 'content/builders-hub/rfps',
})

export const IdeaLockBanner = createLockBanner({
  contentDir: 'content/builders-hub/ideas',
})
