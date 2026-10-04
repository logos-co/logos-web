'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { PublishEnvironment } from '@/services/site-publish/environments'
import type { PublishStatus } from '@/services/site-publish/publish-status'
import { SitePublishCard } from './site-publish-card'
import { useSitePublishTranslation } from './use-site-publish-translation'

const STATUS_ENDPOINT = '/api/site-publish'
const POLL_MS = 10_000

export const SitePublishPanel = () => {
  const { t } = useSitePublishTranslation()
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PublishEnvironment | null>(null)
  const accepted = useRef<{
    environment: PublishEnvironment
    previousRun: number | undefined
  } | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const readStatus = useCallback(async () => {
    try {
      const res = await fetch(STATUS_ENDPOINT, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      const json = (await res.json()) as {
        status?: PublishStatus
        error?: string
      }
      if (!res.ok || !json.status)
        throw new Error(
          json.error ?? t('sitePublish:requestFailed', { status: res.status })
        )
      setStatus(json.status)
      if (accepted.current) {
        const run = json.status[accepted.current.environment].latestRun
        if (
          run &&
          (run.id !== accepted.current.previousRun || run.state !== 'finished')
        ) {
          accepted.current = null
          setPending(null)
        }
      }
    } catch (failure) {
      setStatus(null)
      setError(failure instanceof Error ? failure.message : String(failure))
    }
  }, [t])

  const publish = async (environment: PublishEnvironment): Promise<void> => {
    if (!status || pending) return
    const previewBuild = status.dev.latestRun?.id
    if (
      environment === 'production' &&
      !window.confirm(t('sitePublish:confirm', { build: previewBuild }))
    )
      return
    setPending(environment)
    setError(null)
    try {
      const res = await fetch(STATUS_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, previewBuild }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        throw new Error(
          json.error ?? t('sitePublish:requestFailed', { status: res.status })
        )
      }
      accepted.current = {
        environment,
        previousRun: status[environment].latestRun?.id,
      }
      await readStatus()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
      setPending(null)
    }
  }

  useEffect(() => {
    void readStatus()
    const timer = window.setInterval(() => void readStatus(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [readStatus])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div style={{ marginBottom: 'var(--base, 16px)' }}>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <strong>{t('sitePublish:title')}</strong>
        <div style={{ marginTop: 4, opacity: 0.78 }}>
          {t('sitePublish:description')}
        </div>
      </div>
      {error ? (
        <div
          role="alert"
          style={{ color: 'var(--theme-error-500, #a33)', fontSize: 12 }}
        >
          {error}
        </div>
      ) : null}
      {pending ? <div role="status">{t('sitePublish:accepted')}</div> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {status ? (
          (['dev', 'production'] as const).map((environment) => (
            <SitePublishCard
              key={environment}
              environment={status[environment]}
              mediaUrl={`${status[environment].siteUrl}/media`}
              now={now}
              onPublish={() => void publish(environment)}
              pending={pending !== null}
              title={t(
                environment === 'dev'
                  ? 'sitePublish:staging'
                  : 'sitePublish:production'
              )}
              actionLabel={t(
                environment === 'dev'
                  ? 'sitePublish:buildPreview'
                  : 'sitePublish:publishLive'
              )}
            />
          ))
        ) : (
          <div style={{ fontSize: 12, opacity: 0.78 }}>
            {t('sitePublish:checking')}
          </div>
        )}
      </div>
    </div>
  )
}

export default SitePublishPanel
