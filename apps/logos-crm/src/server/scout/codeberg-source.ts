import type {
  ScoutCandidateSeed,
  ScoutEvidenceSeed,
} from '@/server/db/scout-fixtures'

import { fetchFromSource, SourceUnavailableError } from './source-fetch'
import { carriesPersonalData, codebergPolicy } from './source-policies'
import { sourceSearchTerms } from './source-query'

const DAY = 24 * 60 * 60 * 1000
const REPOS_PER_SEARCH = 12
const OWNERS_EXAMINED_PER_RUN = 8
const ORGANISATIONS_PER_RUN = 4

interface CodebergOwner {
  login: string
}

interface CodebergRepository {
  name: string
  full_name: string
  html_url: string
  description: string | null
  website: string | null
  updated_at: string
  archived: boolean
  fork: boolean
  mirror: boolean
  private: boolean
  has_issues: boolean
  stars_count: number
  topics?: string[]
  owner: CodebergOwner
}

interface CodebergSearchResponse {
  data?: CodebergRepository[]
}

interface CodebergOrganisation {
  username: string
  full_name: string
  description: string
  website: string
  visibility: string
}

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
  sourceTitle: string,
  excerpt: string,
  certainty: ScoutEvidenceSeed['certainty'] = 'exact'
): ScoutEvidenceSeed {
  return {
    field,
    value,
    sourceUrl,
    sourceTitle,
    excerpt,
    contentHash: `${codebergPolicy.extractorVersion}:${sourceUrl}:${field}:${value}`,
    extractionMethod: 'deterministic',
    extractorVersion: codebergPolicy.extractorVersion,
    certainty,
    observedAt: new Date(),
    expiresAt: new Date(Date.now() + codebergPolicy.evidenceTtlDays * DAY),
  }
}

function buildEvidence(
  organisation: Readonly<CodebergOrganisation>,
  repositories: readonly CodebergRepository[]
): ScoutEvidenceSeed[] {
  const profileUrl = `https://codeberg.org/${organisation.username}`
  const items: ScoutEvidenceSeed[] = []
  const website = safeText(organisation.website)
  const description = safeText(organisation.description)

  if (website) {
    const domain = domainOf(website)
    if (domain) {
      items.push(
        evidence(
          'official_site',
          domain,
          profileUrl,
          `${organisation.full_name} on Codeberg`,
          `Website published on the organisation profile: ${website}`
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
        `${organisation.full_name} on Codeberg`,
        description
      )
    )
  }

  const leading = repositories[0]
  if (!leading) return items

  items.push(
    evidence(
      'public_repository',
      `${leading.full_name}, ${leading.stars_count} stars`,
      leading.html_url,
      leading.full_name,
      safeText(leading.description) ??
        `${leading.name} is published by the organisation.`,
      'derived'
    )
  )

  if (!description && leading.topics?.length) {
    const topics = leading.topics.filter((topic) => !carriesPersonalData(topic))
    if (topics.length > 0) {
      items.push(
        evidence(
          'theme_match',
          topics.slice(0, 5).join(', '),
          leading.html_url,
          leading.full_name,
          `Repository topics: ${topics.join(', ')}.`,
          'ambiguous'
        )
      )
    }
  }

  const updated = new Date(leading.updated_at)
  if (!Number.isNaN(updated.getTime())) {
    const date = updated.toISOString().slice(0, 10)
    items.push(
      evidence(
        'recent_release',
        `Latest public change ${date}`,
        leading.html_url,
        leading.full_name,
        `The most recently updated public repository was changed on ${date}.`,
        'derived'
      )
    )
  }

  if (leading.has_issues) {
    items.push(
      evidence(
        'contribution_path',
        'Public issue tracker',
        `${leading.html_url}/issues`,
        `${leading.full_name} issues`,
        `${leading.name} accepts issues from outside the organisation.`,
        'derived'
      )
    )
  }

  const documentationUrl = safeText(leading.website)
  if (documentationUrl) {
    items.push(
      evidence(
        'public_documentation',
        documentationUrl,
        leading.html_url,
        leading.full_name,
        `${leading.name} publishes documentation at ${documentationUrl}.`,
        'derived'
      )
    )
  }

  return items
}

/** Finds organisations on a non-commercial, open-source software forge. */
export async function discoverOnCodeberg(
  query: string
): Promise<ScoutCandidateSeed[]> {
  const repositoriesByName = new Map<string, CodebergRepository>()
  const terms = sourceSearchTerms(query)

  for (const term of terms.length > 0 ? terms : [query]) {
    const search = await fetchFromSource<CodebergSearchResponse>(
      codebergPolicy,
      `https://codeberg.org/api/v1/repos/search?q=${encodeURIComponent(term)}&limit=${REPOS_PER_SEARCH}&sort=updated&order=desc`
    )
    for (const repository of search.data ?? []) {
      repositoriesByName.set(repository.full_name, repository)
    }
  }

  const repositories = [...repositoriesByName.values()].filter(
    (repo) => !repo.archived && !repo.fork && !repo.mirror && !repo.private
  )
  const byOwner = new Map<string, CodebergRepository[]>()

  for (const repository of repositories) {
    const owned = byOwner.get(repository.owner.login) ?? []
    byOwner.set(repository.owner.login, [...owned, repository])
  }

  const candidates: ScoutCandidateSeed[] = []
  for (const [owner, owned] of [...byOwner.entries()].slice(
    0,
    OWNERS_EXAMINED_PER_RUN
  )) {
    if (candidates.length >= ORGANISATIONS_PER_RUN) break

    let organisation: CodebergOrganisation
    try {
      organisation = await fetchFromSource<CodebergOrganisation>(
        codebergPolicy,
        `https://codeberg.org/api/v1/orgs/${encodeURIComponent(owner)}`
      )
    } catch (error) {
      if (error instanceof SourceUnavailableError && error.status === 404) {
        continue
      }
      throw error
    }

    if (organisation.visibility !== 'public') continue
    const displayName =
      safeText(organisation.full_name) ?? safeText(organisation.username)
    if (!displayName) continue

    candidates.push({
      displayName,
      entityType: 'organisation',
      domain: domainOf(safeText(organisation.website)),
      summary: safeText(organisation.description),
      firstSeenDaysAgo: 0,
      lastObservedDaysAgo: 0,
      evidence: buildEvidence(organisation, owned),
    })
  }

  return candidates
}
