import type {
  ScoutCandidateSeed,
  ScoutEvidenceSeed,
} from '@/server/db/scout-fixtures'

import { fetchFromSource } from './source-fetch'
import { carriesPersonalData, openCollectivePolicy } from './source-policies'
import { sourceSearchTerms } from './source-query'

const DAY = 24 * 60 * 60 * 1000
const ACCOUNTS_PER_SEARCH = 8

interface OpenCollectiveAccount {
  slug: string
  name: string
  description: string | null
  website: string | null
  type: 'COLLECTIVE' | 'FUND' | 'ORGANIZATION' | 'PROJECT'
  isActive: boolean
  updatedAt: string
  tags: string[] | null
  stats: { contributorsCount: number }
}

interface OpenCollectiveSearchResponse {
  data?: { accounts?: { nodes?: OpenCollectiveAccount[] } }
  errors?: Array<{ message: string }>
}

const SEARCH_QUERY = `
  query SearchAccounts($term: String!, $limit: Int!) {
    accounts(
      searchTerm: $term
      limit: $limit
      isActive: true
      type: [COLLECTIVE, FUND, ORGANIZATION, PROJECT]
    ) {
      nodes {
        slug
        name
        description
        website
        type
        isActive
        updatedAt
        tags
        stats { contributorsCount }
      }
    }
  }
`

function safeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed || carriesPersonalData(trimmed)) return null
  return trimmed
}

function domainOf(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value.startsWith('http') ? value : `https://${value}`)
      .hostname
  } catch {
    return null
  }
}

function evidence(
  field: ScoutEvidenceSeed['field'],
  value: string,
  sourceUrl: string,
  excerpt: string,
  certainty: ScoutEvidenceSeed['certainty'] = 'exact'
): ScoutEvidenceSeed {
  return {
    field,
    value,
    sourceUrl,
    sourceTitle: 'Open Collective profile',
    excerpt,
    contentHash: `${openCollectivePolicy.extractorVersion}:${sourceUrl}:${field}:${value}`,
    extractionMethod: 'deterministic',
    extractorVersion: openCollectivePolicy.extractorVersion,
    certainty,
    observedAt: new Date(),
    expiresAt: new Date(
      Date.now() + openCollectivePolicy.evidenceTtlDays * DAY
    ),
  }
}

function toCandidate(
  account: Readonly<OpenCollectiveAccount>
): ScoutCandidateSeed | null {
  const name = safeText(account.name)
  if (!name || !account.isActive) return null

  const profileUrl = `https://opencollective.com/${account.slug}`
  const description = safeText(account.description)
  const website = safeText(account.website)
  const tags = (account.tags ?? []).filter((tag) => !carriesPersonalData(tag))
  const items: ScoutEvidenceSeed[] = []

  if (website) {
    const domain = domainOf(website)
    if (domain) {
      items.push(
        evidence(
          'official_site',
          domain,
          profileUrl,
          `Website published on the collective profile: ${website}`
        )
      )
    }
  }

  if (description) {
    items.push(
      evidence(
        'theme_match',
        description.slice(0, 120),
        profileUrl,
        description
      )
    )
  } else if (tags.length > 0) {
    items.push(
      evidence(
        'theme_match',
        tags.slice(0, 5).join(', '),
        profileUrl,
        `Public collective tags: ${tags.join(', ')}.`,
        'derived'
      )
    )
  }

  const updated = new Date(account.updatedAt)
  if (!Number.isNaN(updated.getTime())) {
    const date = updated.toISOString().slice(0, 10)
    items.push(
      evidence(
        'recent_release',
        `Public collective profile updated ${date}`,
        profileUrl,
        `The active collective profile was last updated on ${date}.`,
        'derived'
      )
    )
  }

  items.push(
    evidence(
      'contribution_path',
      `Public contribution page, ${account.stats.contributorsCount} recorded contributors`,
      profileUrl,
      'The collective publishes a public page for contributions and financial support.',
      'derived'
    )
  )

  return {
    displayName: name,
    entityType:
      account.type === 'PROJECT' || account.type === 'FUND'
        ? 'project'
        : account.type === 'COLLECTIVE'
          ? 'community'
          : 'organisation',
    domain: domainOf(website),
    summary: description,
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: items,
  }
}

/** Finds active public-interest organisations without reading their members. */
export async function discoverOnOpenCollective(
  query: string
): Promise<ScoutCandidateSeed[]> {
  const accounts = new Map<string, OpenCollectiveAccount>()
  const terms = sourceSearchTerms(query)

  for (const term of terms.length > 0 ? terms : [query]) {
    const response = await fetchFromSource<OpenCollectiveSearchResponse>(
      openCollectivePolicy,
      'https://api.opencollective.com/graphql/v2',
      {
        method: 'POST',
        body: JSON.stringify({
          query: SEARCH_QUERY,
          variables: { term, limit: ACCOUNTS_PER_SEARCH },
        }),
      }
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(' '))
    }

    for (const account of response.data?.accounts?.nodes ?? []) {
      accounts.set(account.slug, account)
    }
  }

  return [...accounts.values()]
    .map(toCandidate)
    .filter((candidate): candidate is ScoutCandidateSeed => Boolean(candidate))
}
