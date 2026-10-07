'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { PublishEnvironment } from '@/services/site-publish/environments'
import { PUBLISH_ENVIRONMENTS } from '@/services/site-publish/environments'
import type { PublishStatus } from '@/services/site-publish/publish-status'
import { SitePublishCard } from './site-publish-card'
import { useSitePublishTranslation } from './use-site-publish-translation'

const STATUS_ENDPOINT = '/api/site-publish'
const POLL_MS = 10_000

export const SitePublishPanel = () => {
  const { t } = useSitePublishTranslation()
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [error, setError] = useState<{
    environment: PublishEnvironment
    message: string
  } | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [pending, setPending] = useState<PublishEnvironment | null>(null)
  const accepted = useRef<{
    environment: PublishEnvironment
    previousRun: number | undefined
  } | null>(null)

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
      setUnavailable(false)
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
    } catch {
      setStatus(null)
      setUnavailable(true)
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
      setError({
        environment,
        message: failure instanceof Error ? failure.message : String(failure),
      })
      setPending(null)
    }
  }

  useEffect(() => {
    void readStatus()
    const timer = window.setInterval(() => void readStatus(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [readStatus])

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 'var(--base, 16px)',
      }}
    >
      {(['dev', 'production'] as const).map((environment) => (
        <SitePublishCard
          key={environment}
          environment={
            status?.[environment] ?? {
              ...PUBLISH_ENVIRONMENTS[environment],
              canPublish: false,
              estimatedDurationMs: null,
              latestRun: null,
            }
          }
          unavailable={unavailable}
          loading={!status && !unavailable}
          error={error?.environment === environment ? error.message : null}
          onPublish={() => void publish(environment)}
          pending={pending === environment}
          busy={pending !== null}
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
          viewLabel={t(
            environment === 'dev'
              ? 'sitePublish:viewStaging'
              : 'sitePublish:viewLive'
          )}
        />
      ))}
    </div>
  )
}

export default SitePublishPanel
