'use client'

import type {
  PublishEnvironmentStatus,
  PublishRun,
} from '@/services/site-publish/publish-status'
import { useSitePublishTranslation } from './use-site-publish-translation'

type Translate = ReturnType<typeof useSitePublishTranslation>['t']

interface SitePublishCardProps {
  environment: PublishEnvironmentStatus
  mediaUrl: string
  now: number
  onPublish: () => void
  pending: boolean
  title: string
  actionLabel: string
}

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

const formatTime = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  })

const runStateText = (
  run: PublishRun | null,
  now: number,
  t: Translate
): string => {
  if (!run) return t('sitePublish:never')
  if (run.state !== 'finished') {
    const elapsed = run.startedAt ? now - Date.parse(run.startedAt) : 0
    return t(
      run.state === 'queued' ? 'sitePublish:queued' : 'sitePublish:running',
      { duration: formatDuration(elapsed) }
    )
  }
  if (run.succeeded) {
    return t('sitePublish:published', {
      time: run.finishedAt
        ? formatTime(run.finishedAt)
        : t('sitePublish:earlier'),
    })
  }
  return t('sitePublish:failed', {
    result: run.conclusion ?? t('sitePublish:unfinished'),
  })
}

/** How far along a running publish is, against the last good run's time. */
const progressPercent = (
  environment: PublishEnvironmentStatus,
  now: number
): number | null => {
  const run = environment.latestRun
  if (!run || run.state === 'finished' || !run.startedAt) return null
  if (!environment.estimatedDurationMs) return null
  const elapsed = now - Date.parse(run.startedAt)
  return Math.min(
    95,
    Math.max(2, (elapsed / environment.estimatedDurationMs) * 100)
  )
}

const linkStyle = { color: 'inherit', fontSize: 12, cursor: 'pointer' }

export const SitePublishCard = ({
  environment,
  mediaUrl,
  now,
  onPublish,
  pending,
  title,
  actionLabel,
}: SitePublishCardProps) => {
  const { t } = useSitePublishTranslation()
  const run = environment.latestRun
  const percent = progressPercent(environment, now)
  const disabled = pending || !environment.canPublish

  return (
    <div
      style={{
        background: 'var(--theme-bg, #fff)',
        border: '1px solid var(--theme-elevation-150, #dcdcdc)',
        borderRadius: 6,
        display: 'flex',
        flex: '1 1 260px',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 16px',
      }}
    >
      <div
        style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}
      >
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <button
          type="button"
          className="cursor-pointer"
          disabled={disabled}
          onClick={onPublish}
          style={{
            background: 'var(--theme-bg, #fff)',
            border: '1px solid var(--theme-elevation-300, #b8b8b8)',
            borderRadius: 4,
            color: 'inherit',
            cursor: disabled ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 700,
            opacity: disabled ? 0.6 : 1,
            padding: '6px 12px',
          }}
        >
          {pending ? t('sitePublish:starting') : actionLabel}
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.78 }}>
        {runStateText(run, now, t)}
        {environment.blockedReason ? ` ${environment.blockedReason}` : ''}
      </div>

      {percent === null ? null : (
        <div
          aria-hidden="true"
          style={{
            background: 'var(--theme-elevation-100, #eee)',
            borderRadius: 999,
            height: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'var(--theme-success-500, #21c087)',
              height: '100%',
              transition: 'width 1s linear',
              width: `${percent}%`,
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {run ? (
          <a
            className="cursor-pointer"
            href={run.runUrl}
            rel="noreferrer"
            style={linkStyle}
            target="_blank"
          >
            {t('sitePublish:buildLog')}
          </a>
        ) : null}
        <a
          className="cursor-pointer"
          href={environment.siteUrl}
          rel="noreferrer"
          style={linkStyle}
          target="_blank"
        >
          {environment.label}
        </a>
        <a
          className="cursor-pointer"
          href={mediaUrl}
          rel="noreferrer"
          style={linkStyle}
          target="_blank"
        >
          {t('sitePublish:media')}
        </a>
      </div>
    </div>
  )
}

export default SitePublishCard
