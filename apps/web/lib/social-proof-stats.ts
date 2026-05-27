import {
  BI_GRAPHQL_API_URL,
  CIRCLES_GRAPHQL_RESPONSE_KEY,
  CONTRIBUTIONS_API_RESPONSE_KEY,
  CONTRIBUTIONS_API_URL,
} from './logos-data-api'
import { logger } from './logger'

const ACTIVE_CIRCLES_DAYS = 120

const FALLBACK_SOCIAL_PROOF_STATS = {
  contributions: 3441,
  contributors: 218,
  repositories: 341,
  circles: 34,
} as const

type ContributionsApiData = {
  total_commits?: number | null
  total_external_collaborators?: number | null
  total_repositories?: number | null
}

type ContributionsApiResponse = {
  [CONTRIBUTIONS_API_RESPONSE_KEY]?: ContributionsApiData[]
}

type CirclesApiResponse = {
  data?: {
    [CIRCLES_GRAPHQL_RESPONSE_KEY]?: {
      aggregate?: {
        count?: number | null
      }
    }
  }
}

export interface SocialProofStats {
  contributions: string
  contributors: string
  repositories: string
  circles: string
}

function formatStat(
  value: number | null | undefined,
  fallback: number
): string {
  return (value ?? fallback).toLocaleString('en-US')
}

function getTodayISODateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0] ?? ''
}

function getCirclesGraphqlQuery(dateString: string): string {
  return `query CountDistinctCities {
  ${CIRCLES_GRAPHQL_RESPONSE_KEY}(where: { end_at: { _gte: "${dateString}" } }) {
    aggregate {
      count(distinct: true, columns: location_city)
    }
  }
}`
}

async function fetchContributionsData(): Promise<ContributionsApiData | null> {
  try {
    const response = await fetch(CONTRIBUTIONS_API_URL, {
      cache: 'force-cache',
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

async function fetchTotalCircles(): Promise<number | null> {
  try {
    const activeSinceDate = getTodayISODateDaysAgo(ACTIVE_CIRCLES_DAYS)
    const response = await fetch(BI_GRAPHQL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: getCirclesGraphqlQuery(activeSinceDate),
      }),
      cache: 'force-cache',
    })

    if (!response.ok) {
      throw new Error(`Circles request failed: ${response.status}`)
    }

    const data = (await response.json()) as CirclesApiResponse
    return data.data?.[CIRCLES_GRAPHQL_RESPONSE_KEY]?.aggregate?.count ?? null
  } catch (error) {
    logger.error('Failed to fetch social proof circle stats', { error })
    return null
  }
}

export async function getSocialProofStats(): Promise<SocialProofStats> {
  const [contributionsData, totalCircles] = await Promise.all([
    fetchContributionsData(),
    fetchTotalCircles(),
  ])

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
    circles: formatStat(totalCircles, FALLBACK_SOCIAL_PROOF_STATS.circles),
  }
}
