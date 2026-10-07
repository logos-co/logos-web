'use client'

import { useId, type CSSProperties } from 'react'
import type { PublishEnvironmentStatus } from '@/services/site-publish/publish-status'
import { useSitePublishTranslation } from './use-site-publish-translation'

interface SitePublishCardProps {
  environment: PublishEnvironmentStatus
  onPublish: () => void
  pending: boolean
  busy: boolean
  loading: boolean
  error: string | null
  title: string
  actionLabel: string
  viewLabel: string
  unavailable: boolean
}

const buttonStyle: CSSProperties = {
  border: '1px solid var(--theme-elevation-300, #b8b8b8)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  padding: '8px 12px',
  textDecoration: 'none',
}

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'var(--theme-elevation-900, #222)',
  color: 'var(--theme-elevation-0, #fff)',
}

export const SitePublishCard = ({
  environment,
  onPublish,
  pending,
  busy,
  loading,
  error,
  title,
  actionLabel,
  viewLabel,
  unavailable,
}: SitePublishCardProps) => {
  const { t } = useSitePublishTranslation()
  const disabled = busy || loading || unavailable || !environment.canPublish
  const statusId = useId()
  const blockedMessage = unavailable
    ? t('sitePublish:unavailable')
    : environment.blockedReasonKey
      ? t(`sitePublish:${environment.blockedReasonKey}`)
      : null
  const runState = environment.latestRun?.state

  return (
    <section
      aria-label={title}
      style={{
        background: 'var(--theme-bg, #fff)',
        border: '1px solid var(--theme-elevation-150, #dcdcdc)',
        borderRadius: 6,
        display: 'flex',
        flex: '1 1 260px',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
      }}
    >
      <strong style={{ fontSize: 15 }}>{title}</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          className="cursor-pointer"
          disabled={disabled}
          onClick={onPublish}
          aria-describedby={blockedMessage ? statusId : undefined}
          style={{
            ...primaryButtonStyle,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {loading
            ? t('sitePublish:checking')
            : pending
              ? t('sitePublish:starting')
              : runState === 'queued'
                ? t('sitePublish:queued')
                : runState === 'running'
                  ? t('sitePublish:running')
                  : actionLabel}
        </button>
        <a
          className="cursor-pointer"
          href={environment.siteUrl}
          rel="noreferrer"
          style={{
            ...buttonStyle,
            background: 'transparent',
            color: 'inherit',
          }}
          target="_blank"
        >
          {viewLabel}
        </a>
      </div>
      {blockedMessage ? (
        <div id={statusId} role="status" style={{ fontSize: 12 }}>
          {blockedMessage}
        </div>
      ) : null}
      {error ||
      (environment.latestRun?.state === 'finished' &&
        !environment.latestRun.succeeded) ? (
        <div
          role="alert"
          style={{ color: 'var(--theme-error-500, #a33)', fontSize: 12 }}
        >
          {error ?? t('sitePublish:buildFailed')}
        </div>
      ) : null}
    </section>
  )
}

export default SitePublishCard
