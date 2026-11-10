import {
  CONTRIBUTIONS_API_RESPONSE_KEY,
  CONTRIBUTIONS_API_URL,
} from './logos-data-api'
import { logger } from './logger'

// Next aborts a static page after 60s; give up early and use the fallback.
const CONTRIBUTIONS_FETCH_TIMEOUT_MS = 10_000

const FALLBACK_SOCIAL_PROOF_STATS = {
  contributions: 3441,
  contributors: 218,
  repositories: 341,
} as const

type ContributionsApiData = {
  total_commits?: number | null
  total_external_collaborators?: number | null
  total_repositories?: number | null
}

type ContributionsApiResponse = {
  [CONTRIBUTIONS_API_RESPONSE_KEY]?: ContributionsApiData[]
}

export interface SocialProofStats {
  contributions: string
  contributors: string
  repositories: string
}

function formatStat(
  value: number | null | undefined,
  fallback: number
): string {
  return (value ?? fallback).toLocaleString('en-US')
}

async function fetchContributionsData(): Promise<ContributionsApiData | null> {
  try {
    const response = await fetch(CONTRIBUTIONS_API_URL, {
      cache: 'force-cache',
      signal: AbortSignal.timeout(CONTRIBUTIONS_FETCH_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new Error(`Contributions request failed: ${response.status}`)
    }

    const data = (await response.json()) as ContributionsApiResponse
    return data[CONTRIBUTIONS_API_RESPONSE_KEY]?.[0] ?? null
  } catch (error) {
    logger.error('Failed to fetch social proof contribution stats', { error })
    return null
  }
}

export async function getSocialProofStats(): Promise<SocialProofStats> {
  const contributionsData = await fetchContributionsData()

  return {
    contributions: formatStat(
      contributionsData?.total_commits,
      FALLBACK_SOCIAL_PROOF_STATS.contributions
    ),
    contributors: formatStat(
      contributionsData?.total_external_collaborators,
      FALLBACK_SOCIAL_PROOF_STATS.contributors
    ),
    repositories: formatStat(
      contributionsData?.total_repositories,
      FALLBACK_SOCIAL_PROOF_STATS.repositories
    ),
  }
}
