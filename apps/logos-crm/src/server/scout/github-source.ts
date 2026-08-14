import type {
  ScoutCandidateSeed,
  ScoutEvidenceSeed,
} from '@/server/db/scout-fixtures'

import { fetchFromSource } from './source-fetch'
import { carriesPersonalData, githubPolicy } from './source-policies'

const DAY = 24 * 60 * 60 * 1000
const REPOS_PER_SEARCH = 12
const ACCOUNTS_PER_SEARCH = 5
const ORGANISATIONS_PER_RUN = 4
/**
 * How many owners a run will look at before giving up. Most repository owners
 * are individuals, so a run that stopped at four owners would usually return
 * one organisation and three quarantines.
 */
const OWNERS_EXAMINED_PER_RUN = 9

/** Only the fields the policy permits are read off the response at all. */
interface GitHubAccount {
  login: string
  type: string
  name: string | null
  blog: string | null
  description: string | null
  html_url: string
}

interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  description: string | null
  homepage: string | null
  pushed_at: string | null
  stargazers_count: number
  fork: boolean
  has_issues: boolean
  topics?: string[]
  owner: { login: string; type: string }
}

interface RepoSearchResponse {
  items: GitHubRepo[]
}

interface AccountSearchResponse {
  items: { login: string; type: string }[]
}

export interface SourceFindings {
  candidate: ScoutCandidateSeed
  /** Set when the subject turned out to be a person rather than a body. */
  quarantined: boolean
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
    contentHash: `${githubPolicy.extractorVersion}:${sourceUrl}:${value}`,
    extractionMethod: 'deterministic',
    extractorVersion: githubPolicy.extractorVersion,
    certainty,
    observedAt: new Date(),
    expiresAt: new Date(Date.now() + githubPolicy.evidenceTtlDays * DAY),
  }
}

/**
 * Keeps a value only if it says something and says nothing personal.
 *
 * GitHub returns a contact address on an organisation profile and a handle
 * beside it. Neither is read into evidence, and anything that merely looks
 * like a contact detail is dropped as well: losing one sentence costs less
 * than storing one address.
 */
function safeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return carriesPersonalData(trimmed) ? null : trimmed
}

function domainOf(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname
  } catch {
    return null
  }
}

function buildEvidence(
  account: Readonly<GitHubAccount>,
  repos: readonly GitHubRepo[]
): ScoutEvidenceSeed[] {
  const profileUrl = account.html_url
  const items: ScoutEvidenceSeed[] = []
  const published = repos.filter((repo) => !repo.fork)

  const site = safeText(account.blog)
  const siteDomain = domainOf(site)
  if (siteDomain && site) {
    items.push(
      evidence(
        'official_site',
        siteDomain,
        profileUrl,
        `${account.login} on GitHub`,
        `Website listed on the organisation profile: ${site}`
      )
    )
  }

  // The organisation's own words about itself, quoted rather than
  // interpreted: the rubric decides relevance, the adapter does not.
  const description = safeText(account.description)
  if (description) {
    items.push(
      evidence(
        'theme_match',
        description.slice(0, 120),
        profileUrl,
        `${account.login} on GitHub`,
        description
      )
    )
  }

  const leading = published[0]
  if (leading) {
    const topics = leading.topics?.filter((topic) => !carriesPersonalData(topic))

    items.push(
      evidence(
        'public_repository',
        `${leading.full_name}, ${leading.stargazers_count} stars`,
        leading.html_url,
        leading.full_name,
        safeText(leading.description) ??
          `${leading.name} is published under the organisation.`,
        'derived'
      )
    )

    if (!description && topics && topics.length > 0) {
      // Only when the profile said nothing: topics are the organisation's own
      // labels, but they are labels rather than a statement of purpose.
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

  const pushed = published
    .map((repo) => repo.pushed_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)

  const mostRecent = published.find((repo) => repo.pushed_at === pushed)
  if (pushed && mostRecent) {
    items.push(
      evidence(
        'recent_release',
        `Latest public change ${pushed.slice(0, 10)}`,
        mostRecent.html_url,
        mostRecent.full_name,
        `The most recently updated public repository was changed on ${pushed.slice(0, 10)}.`,
        'derived'
      )
    )
  }

  const open = published.find((repo) => repo.has_issues)
  if (open) {
    items.push(
      evidence(
        'contribution_path',
        'Public issue tracker',
        `${open.html_url}/issues`,
        `${open.full_name} issues`,
        `${open.name} accepts issues from outside the organisation.`,
        'derived'
      )
    )
  }

  const documented = published.find((repo) => safeText(repo.homepage))
  const documentationUrl = safeText(documented?.homepage ?? null)
  if (documented && documentationUrl) {
    items.push(
      evidence(
        'public_documentation',
        documentationUrl,
        documented.html_url,
        documented.full_name,
        `${documented.name} publishes documentation at ${documentationUrl}.`,
        'derived'
      )
    )
  }

  return items
}

/**
 * Finds organisations through the work they publish.
 *
 * Repositories are searched rather than accounts, because an account search
 * matches names and a topic is not a name: "decentralised messaging" finds
 * nothing as a login and a dozen projects as a description. The owner of each
 * result is then checked on its own profile, because the owner type is the
 * whole boundary here and a search filter is not a guarantee. An owner who
 * turns out to be a person is quarantined with nothing kept beyond the reason.
 */
export async function discoverOnGitHub(
  query: string
): Promise<SourceFindings[]> {
  // Two searches, because they fail in opposite directions. A topic phrase
  // finds nothing as an account name, and an organisation's own name is
  // rarely in the description of the repositories it publishes.
  const [repoSearch, accountSearch] = await Promise.all([
    fetchFromSource<RepoSearchResponse>(
      githubPolicy,
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${REPOS_PER_SEARCH}`
    ),
    fetchFromSource<AccountSearchResponse>(
      githubPolicy,
      `https://api.github.com/search/users?q=${encodeURIComponent(`${query} type:org`)}&per_page=${ACCOUNTS_PER_SEARCH}`
    ).catch(() => ({ items: [] }) as AccountSearchResponse),
  ])

  const byOwner = new Map<string, GitHubRepo[]>()
  for (const account of accountSearch.items) {
    byOwner.set(account.login, [])
  }
  for (const repo of repoSearch.items) {
    const existing = byOwner.get(repo.owner.login) ?? []
    byOwner.set(repo.owner.login, [...existing, repo])
  }

  const findings: SourceFindings[] = []
  let organisations = 0

  for (const [login, repos] of [...byOwner.entries()].slice(
    0,
    OWNERS_EXAMINED_PER_RUN
  )) {
    if (organisations >= ORGANISATIONS_PER_RUN) break

    const account = await fetchFromSource<GitHubAccount>(
      githubPolicy,
      `https://api.github.com/users/${encodeURIComponent(login)}`
    )

    if (account.type !== 'Organization') {
      findings.push({
        quarantined: true,
        candidate: {
          displayName: login,
          entityType: 'unknown',
          domain: null,
          summary: null,
          reviewState: 'quarantined',
          quarantineReason:
            'The GitHub account behind this work is a personal account, not an organisation. Nothing was extracted.',
          firstSeenDaysAgo: 0,
          lastObservedDaysAgo: 0,
          evidence: [],
        },
      })
      continue
    }

    // An organisation found by name has no repositories in hand yet, and the
    // profile alone says very little.
    const owned =
      repos.length > 0
        ? repos
        : await fetchFromSource<GitHubRepo[]>(
            githubPolicy,
            `https://api.github.com/orgs/${encodeURIComponent(login)}/repos?per_page=5&sort=pushed`
          ).catch(() => [])

    organisations += 1
    findings.push({
      quarantined: false,
      candidate: {
        displayName: safeText(account.name) ?? account.login,
        entityType: 'organisation',
        domain: domainOf(safeText(account.blog)),
        summary: safeText(account.description),
        firstSeenDaysAgo: 0,
        lastObservedDaysAgo: 0,
        evidence: buildEvidence(account, owned),
      },
    })
  }

  return findings
}
