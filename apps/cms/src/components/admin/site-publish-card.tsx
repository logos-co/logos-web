'use client'

import type { CSSProperties } from 'react'
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
  jenkinsActionLabel: string
  viewLabel: string
  jenkinsUrl: string
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
  jenkinsActionLabel,
  viewLabel,
  jenkinsUrl,
  unavailable,
}: SitePublishCardProps) => {
  const { t } = useSitePublishTranslation()
  const disabled = busy || loading || !environment.canPublish

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
        {unavailable ? (
          <a
            className="cursor-pointer"
            href={`${jenkinsUrl}build?delay=0sec`}
            rel="noreferrer"
            target="_blank"
            style={primaryButtonStyle}
          >
            {jenkinsActionLabel}
          </a>
        ) : (
          <button
            type="button"
            className="cursor-pointer"
            disabled={disabled}
            onClick={onPublish}
            title={environment.blockedReason}
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
                : actionLabel}
          </button>
        )}
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
      {error ? (
        <div
          role="alert"
          style={{ color: 'var(--theme-error-500, #a33)', fontSize: 12 }}
        >
          {error}
        </div>
      ) : null}
    </section>
  )
}

export default SitePublishCard
