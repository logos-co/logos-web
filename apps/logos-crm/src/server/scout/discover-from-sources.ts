import type { ScoutCandidateSeed } from '@/server/db/scout-fixtures'
import { insertScoutCandidate } from '@/server/db/seed-scout'
import {
  buildSourceQuery,
  matchesTargetProfile,
  type ScoutTargetProfile,
} from '@/server/scout-target-profile'

import { discoverOnGitHub } from './github-source'
import {
  corroborateFromDuckDuckGo,
  corroborateFromWikipedia,
} from './reference-source'
import { SourceUnavailableError } from './source-fetch'

export interface SourceDiscoveryOutcome {
  discovered: string[]
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
  const sourcesUsed = new Set<string>()
  let quarantined = 0
  let skipped = 0

  let findings
  try {
    findings = await discoverOnGitHub(buildSourceQuery(profile))
    sourcesUsed.add('GitHub')
  } catch (error) {
    if (error instanceof SourceUnavailableError) {
      return {
        discovered: [],
        quarantined: 0,
        skipped: 0,
        sourcesUsed: [],
        failures: [error.message],
      }
    }
    throw error
  }

  for (const finding of findings) {
    if (finding.quarantined) {
      const id = await insertScoutCandidate(finding.candidate)
      if (id) quarantined += 1
      else skipped += 1
      continue
    }

    if (!matchesTargetProfile(finding.candidate, profile)) {
      skipped += 1
      continue
    }

    const withCorroboration = await corroborate(finding.candidate, failures)
    if (withCorroboration.evidence.length > finding.candidate.evidence.length) {
      sourcesUsed.add('reference works')
    }

    const id = await insertScoutCandidate(withCorroboration)
    if (id) discovered.push(id)
    else skipped += 1
  }

  return {
    discovered,
    quarantined,
    skipped,
    sourcesUsed: [...sourcesUsed],
    failures: [...new Set(failures)],
  }
}
