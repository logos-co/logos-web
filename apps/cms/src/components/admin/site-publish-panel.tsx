'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  SitePublishCard,
  type PublishEnvironmentView,
} from './site-publish-card'

type PublishEnvironmentName = 'dev' | 'production'

interface PublishStatusResponse {
  error?: string
  fetchedAt?: string
  status?: Record<PublishEnvironmentName, PublishEnvironmentView>
}

const STATUS_ENDPOINT = '/api/site-publish'
/** While a publish runs the panel keeps up; the server caches the reads. */
const POLL_MS = 10_000
const CLOCK_MS = 1_000

const PRODUCTION_CONFIRM =
  'Publish logos.co? This puts the current CMS content on the live site.'

const isRunning = (status: PublishStatusResponse['status']): boolean =>
  Boolean(
    status &&
    Object.values(status).some(
      (environment) =>
        environment.latestRun && environment.latestRun.state !== 'finished'
    )
  )

export const SitePublishPanel = () => {
  const [response, setResponse] = useState<PublishStatusResponse | null>(null)
  const [pending, setPending] = useState<PublishEnvironmentName | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const readStatus = useCallback(async () => {
    try {
      const res = await fetch(STATUS_ENDPOINT, { credentials: 'same-origin' })
      const json = (await res.json()) as PublishStatusResponse
      setResponse(
        res.ok
          ? json
          : { error: json.error ?? `request failed (${res.status})` }
      )
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }, [])

  const publish = useCallback(
    async (environment: PublishEnvironmentName) => {
      if (environment === 'production' && !window.confirm(PRODUCTION_CONFIRM)) {
        return
      }
      setPending(environment)
      try {
        const res = await fetch(STATUS_ENDPOINT, {
          body: JSON.stringify({ environment }),
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!res.ok) {
          const json = (await res.json()) as { error?: string }
          setResponse((current) => ({
            ...current,
            error: json.error ?? `request failed (${res.status})`,
          }))
        }
      } catch (error) {
        setResponse((current) => ({
          ...current,
          error: error instanceof Error ? error.message : String(error),
        }))
      } finally {
        setPending(null)
        await readStatus()
      }
    },
    [readStatus]
  )

  useEffect(() => {
    void readStatus()
    const timer = window.setInterval(() => void readStatus(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [readStatus])

  useEffect(() => {
    if (!isRunning(response?.status)) return
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_MS)
    return () => window.clearInterval(timer)
  }, [response])

  const status = response?.status

  return (
    <div style={{ marginBottom: 'var(--base, 16px)' }}>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <strong>Publish the site</strong>
        <div style={{ marginTop: 4, opacity: 0.78 }}>
          The site is built as static pages, so CMS changes appear once it is
          published. Publish to dev first, check it, then publish live.
        </div>
      </div>

      {response?.error ? (
        <div style={{ color: 'var(--theme-error-500, #a33)', fontSize: 12 }}>
          {response.error}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {status ? (
          <>
            <SitePublishCard
              environment={status.dev}
              mediaUrl={`${status.dev.siteUrl}/media`}
              now={now}
              onPublish={() => void publish('dev')}
              pending={pending === 'dev'}
              title="dev.logos.co"
            />
            <SitePublishCard
              environment={status.production}
              mediaUrl={`${status.production.siteUrl}/media`}
              now={now}
              onPublish={() => void publish('production')}
              pending={pending === 'production'}
              title="logos.co (live)"
            />
          </>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.78 }}>Checking...</div>
        )}
      </div>
    </div>
  )
}

export default SitePublishPanel
