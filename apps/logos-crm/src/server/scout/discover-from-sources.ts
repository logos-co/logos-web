import type { ScoutCandidateSeed } from '@/server/db/scout-fixtures'
import {
  insertScoutCandidate,
  upsertDiscoveredScoutCandidate,
} from '@/server/db/seed-scout'
import {
  buildSourceQuery,
  rankSourceCandidates,
  type ScoutTargetProfile,
} from '@/server/scout-target-profile'

import { discoverOnCodeberg } from './codeberg-source'
import { discoverOnGitHub } from './github-source'
import { discoverOnOpenCollective } from './open-collective-source'
import {
  corroborateFromDuckDuckGo,
  corroborateFromWikipedia,
} from './reference-source'
import { SourceUnavailableError } from './source-fetch'

export interface SourceDiscoveryOutcome {
  discovered: string[]
  enriched: number
  quarantined: number
  skipped: number
  sourcesUsed: string[]
  failures: string[]
}

/**
 * Adds the second opinion the rubric needs.
 *
 * A run that only read GitHub would produce candidates whose every claim comes
 * from one profile, and the gate would hold every one of them at "not enough
 * evidence" - correctly, but uselessly. Corroboration is attempted for each
 * candidate and is allowed to fail: a reference work with nothing to say about
 * an organisation is a fact about the organisation, not an error.
 */
async function corroborate(
  candidate: ScoutCandidateSeed,
  failures: string[]
): Promise<ScoutCandidateSeed> {
  const extra: ScoutCandidateSeed['evidence'] = []

  for (const lookup of [corroborateFromWikipedia, corroborateFromDuckDuckGo]) {
    try {
      extra.push(...(await lookup(candidate.displayName)))
    } catch (error) {
      if (error instanceof SourceUnavailableError) {
        failures.push(error.message)
      }
    }
  }

  // Two lookups can return the same underlying page. Keeping one of each URL
  // is what stops "two sources agree" from meaning "we read one page twice".
  const seen = new Set(candidate.evidence.map((item) => item.sourceUrl))
  const deduped = extra.filter((item) => {
    if (seen.has(item.sourceUrl)) return false
    seen.add(item.sourceUrl)
    return true
  })

  return { ...candidate, evidence: [...candidate.evidence, ...deduped] }
}

/**
 * Runs discovery against the approved sources.
 *
 * Every candidate goes through the same writer the synthetic catalogue uses,
 * so a real candidate is stored, assessed, and reviewed exactly like an
 * invented one. The only difference is where the evidence came from, which is
 * recorded on every row.
 */
export async function discoverFromSources(
  profile: Readonly<ScoutTargetProfile>
): Promise<SourceDiscoveryOutcome> {
  const failures: string[] = []
  const discovered: string[] = []
  let enriched = 0
  const sourcesUsed = new Set<string>()
  let quarantined = 0
  let skipped = 0

  const query = buildSourceQuery(profile)
  const adapters = [
    { name: 'GitHub', run: () => discoverOnGitHub(query) },
    {
      name: 'Codeberg',
      run: async () =>
        (await discoverOnCodeberg(query)).map((candidate) => ({
          candidate,
          quarantined: false,
        })),
    },
    {
      name: 'Open Collective',
      run: async () =>
        (await discoverOnOpenCollective(query)).map((candidate) => ({
          candidate,
          quarantined: false,
        })),
    },
  ]
  const outcomes = await Promise.allSettled(
    adapters.map(async (adapter) => ({
      adapter,
      findings: await adapter.run(),
    }))
  )
  const findings = outcomes.flatMap((outcome, index) => {
    const adapter = adapters[index]
    if (!adapter) return []

    if (outcome.status === 'fulfilled') {
      sourcesUsed.add(adapter.name)
      const quarantined = outcome.value.findings
        .filter((finding) => finding.quarantined)
        .slice(0, 1)
      const accepted = rankSourceCandidates(
        outcome.value.findings
          .filter((finding) => !finding.quarantined)
          .map((finding) => finding.candidate),
        profile
      )
        .slice(0, 2)
        .map((candidate) => ({ candidate, quarantined: false }))
      skipped +=
        outcome.value.findings.filter((finding) => !finding.quarantined)
          .length - accepted.length
      return [...accepted, ...quarantined]
    }

    failures.push(
      outcome.reason instanceof SourceUnavailableError
        ? outcome.reason.message
        : `${adapter.name} could not be searched.`
    )
    return []
  })

  for (const finding of findings) {
    if (finding.quarantined) {
      const id = await insertScoutCandidate(finding.candidate)
      if (id) quarantined += 1
      else skipped += 1
      continue
    }

    const withCorroboration = await corroborate(finding.candidate, failures)
    if (withCorroboration.evidence.length > finding.candidate.evidence.length) {
      sourcesUsed.add('reference works')
    }

    const result = await upsertDiscoveredScoutCandidate(withCorroboration)
    if (result.created) discovered.push(result.id)
    else if (result.evidenceAdded > 0) enriched += 1
    else skipped += 1
  }

  return {
    discovered,
    enriched,
    quarantined,
    skipped,
    sourcesUsed: [...sourcesUsed],
    failures: [...new Set(failures)],
  }
}
