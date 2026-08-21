import { getServerEnv } from '@/server/env'

import type { SourcePolicy } from './source-policies'

/**
 * Identifies the crawler to the sources it reads, so an operator who wants it
 * to stop has somebody to tell.
 */
const USER_AGENT =
  'logos-scout/0.1 (organisation discovery; contact partnerships@logos.co)'

/** Last request time per policy, so a run cannot burst through a rate limit. */
const lastRequestAt = new Map<string, number>()

export class SourceUnavailableError extends Error {
  constructor(
    readonly policyId: string,
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'SourceUnavailableError'
  }
}

async function waitForTurn(policy: Readonly<SourcePolicy>): Promise<void> {
  const previous = lastRequestAt.get(policy.id)
  const now = Date.now()

  if (previous !== undefined) {
    const wait = previous + policy.minRequestIntervalMs - now
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  }

  lastRequestAt.set(policy.id, Date.now())
}

/**
 * The only way Scout reaches the network.
 *
 * Every call names the policy it is acting under, and the host has to be in
 * that policy's list. A URL assembled from a source's own response cannot lead
 * anywhere the policy did not already allow, which is the property that keeps
 * "follow this link" from becoming a general-purpose crawler.
 */
export async function fetchFromSource<T>(
  policy: Readonly<SourcePolicy>,
  url: string,
  init: Readonly<RequestInit> = {}
): Promise<T> {
  const target = new URL(url)

  if (!policy.allowedHosts.includes(target.hostname)) {
    throw new Error(
      `${policy.id} may not reach ${target.hostname}. Allowed: ${policy.allowedHosts.join(', ')}.`
    )
  }

  await waitForTurn(policy)

  const headers = new Headers(init.headers)
  headers.set('User-Agent', USER_AGENT)
  headers.set('Accept', 'application/json')

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // A token raises GitHub's rate limit and nothing else. It cannot enable an
  // adapter: the adapter is enabled by SCOUT_SOURCES_ENABLED and by having a
  // policy, and it works without a token.
  const { GITHUB_TOKEN } = getServerEnv()
  if (policy.id === 'github' && GITHUB_TOKEN) {
    headers.set('Authorization', `Bearer ${GITHUB_TOKEN}`)
  }

  const response = await fetch(target, {
    ...init,
    headers,
    signal: AbortSignal.timeout(policy.requestTimeoutMs),
  })

  if (!response.ok) {
    throw new SourceUnavailableError(
      policy.id,
      response.status,
      response.status === 403 || response.status === 429
        ? `${policy.name} refused the request, most likely a rate limit.`
        : `${policy.name} answered ${response.status}.`
    )
  }

  return (await response.json()) as T
}

export function areSourcesEnabled(): boolean {
  return getServerEnv().SCOUT_SOURCES_ENABLED === 'true'
}
