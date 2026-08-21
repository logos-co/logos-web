import type { ScoutDiscoveryBrief } from '@/contracts/scout'
import type { ScoutCandidateSeed } from '@/server/db/scout-fixtures'

export type ScoutTargetProfile = Pick<
  ScoutDiscoveryBrief,
  | 'query'
  | 'organisationTypes'
  | 'themes'
  | 'exclusions'
  | 'regions'
  | 'activeWithinMonths'
>

const SEARCH_QUERY_MAX_LENGTH = 240
const DAY = 24 * 60 * 60 * 1000
const logosAlignmentTerms = [
  'blockchain',
  'censorship resistant',
  'censorship-resistant',
  'community',
  'commons',
  'cryptograph',
  'decentralised',
  'decentralized',
  'messaging',
  'mixnet',
  'network',
  'open source',
  'open-source',
  'p2p',
  'peer-to-peer',
  'privacy',
  'private',
  'protocol',
  'public good',
  'storage',
] as const

const ignoredSearchWords = new Set([
  'a',
  'an',
  'and',
  'for',
  'in',
  'of',
  'open',
  'organisation',
  'organisations',
  'organization',
  'organizations',
  'project',
  'projects',
  'the',
  'to',
  'with',
])

function normaliseSearchWord(value: string): string {
  return value
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/(ing|ed|es|s)$/i, '')
}

function searchWords(values: readonly string[]): string[] {
  return [
    ...new Set(
      values
        .flatMap((value) => value.split(/\s+/))
        .map(normaliseSearchWord)
        .filter((value) => value.length >= 3 && !ignoredSearchWords.has(value))
    ),
  ]
}

function searchableText(candidate: Readonly<ScoutCandidateSeed>): string {
  return [
    candidate.displayName,
    candidate.domain,
    candidate.summary,
    ...candidate.evidence.flatMap((item) => [
      item.value,
      item.sourceTitle,
      item.excerpt,
    ]),
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLocaleLowerCase('en')
}

function sourceRelevance(
  candidate: Readonly<ScoutCandidateSeed>,
  profile: Readonly<ScoutTargetProfile>
): number | null {
  const text = searchableText(candidate)
  const queryWords = searchWords([profile.query])
  const targetWords = searchWords([
    profile.query,
    ...profile.themes,
    ...profile.organisationTypes,
    ...profile.regions,
  ])
  const queryScore = queryWords.filter((word) => text.includes(word)).length
  const targetScore = targetWords.filter((word) => text.includes(word)).length
  const logosScore = logosAlignmentTerms.filter((term) =>
    text.includes(term)
  ).length

  if (queryWords.length > 0 && queryScore === 0) return null
  if (targetWords.length > 0 && targetScore === 0) return null
  if (logosScore < 2) return null
  return queryScore * 2 + targetScore + logosScore * 2
}

function generalRelevance(
  candidate: Readonly<ScoutCandidateSeed>,
  profile: Readonly<ScoutTargetProfile>
): number | null {
  const text = searchableText(candidate)
  const targetWords = searchWords([
    profile.query,
    ...profile.themes,
    ...profile.organisationTypes,
    ...profile.regions,
  ])
  const score = targetWords.filter((word) => text.includes(word)).length
  return targetWords.length === 0 || score > 0 ? score : null
}

function latestPublishedDate(
  candidate: Readonly<ScoutCandidateSeed>
): Date | null {
  const dates = candidate.evidence
    .filter((item) => item.field === 'recent_release')
    .flatMap((item) => {
      const value = /\b\d{4}-\d{2}-\d{2}\b/.exec(item.value)?.[0]
      return value ? [new Date(`${value}T12:00:00.000Z`)] : []
    })
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())

  return dates[0] ?? null
}

/**
 * Builds the broad query sent to an approved discovery source.
 *
 * The source still owns its supported syntax. These are plain target terms,
 * not permissions or arbitrary user-authored qualifiers.
 */
export function buildSourceQuery(
  profile: Readonly<ScoutTargetProfile>
): string {
  return [
    ...new Set([
      profile.query.trim(),
      ...profile.themes,
      ...profile.organisationTypes,
      ...profile.regions,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, SEARCH_QUERY_MAX_LENGTH)
    .trim()
}

/** Applies target rules the source cannot express reliably. */
export function matchesTargetProfile(
  candidate: Readonly<ScoutCandidateSeed>,
  profile: Readonly<ScoutTargetProfile>,
  now = Date.now()
): boolean {
  const text = searchableText(candidate)
  const excluded = searchWords(profile.exclusions)

  if (excluded.some((word) => text.includes(word))) return false

  if (profile.activeWithinMonths) {
    const published = latestPublishedDate(candidate)
    if (!published) return false
    const oldestAllowed = now - profile.activeWithinMonths * 30.4375 * DAY
    if (published.getTime() < oldestAllowed) return false
  }

  return true
}

/**
 * Orders the synthetic catalogue by how well it demonstrates this target.
 * A zero-overlap fixture is omitted rather than presented as a real match.
 */
export function rankSyntheticCandidates(
  candidates: readonly ScoutCandidateSeed[],
  profile: Readonly<ScoutTargetProfile>,
  now = Date.now()
): ScoutCandidateSeed[] {
  return candidates
    .filter((candidate) => matchesTargetProfile(candidate, profile, now))
    .map((candidate) => ({
      candidate,
      score: generalRelevance(candidate, profile),
    }))
    .filter(
      (result): result is { candidate: ScoutCandidateSeed; score: number } =>
        result.score !== null
    )
    .sort((left, right) => right.score - left.score)
    .map(({ candidate }) => candidate)
}

/** Ranks external findings and omits broad-search results with weak overlap. */
export function rankSourceCandidates(
  candidates: readonly ScoutCandidateSeed[],
  profile: Readonly<ScoutTargetProfile>,
  now = Date.now()
): ScoutCandidateSeed[] {
  return candidates
    .filter((candidate) => matchesTargetProfile(candidate, profile, now))
    .map((candidate) => ({
      candidate,
      score: sourceRelevance(candidate, profile),
    }))
    .filter(
      (result): result is { candidate: ScoutCandidateSeed; score: number } =>
        result.score !== null
    )
    .sort((left, right) => right.score - left.score)
    .map(({ candidate }) => candidate)
}
