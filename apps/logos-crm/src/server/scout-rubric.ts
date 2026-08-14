import type {
  ScoutConflict,
  ScoutDimensionResult,
  ScoutEvidence,
} from '@/contracts/scout'
import {
  CURRENT_SCOUT_RUBRIC_VERSION,
  SCOUT_MIN_DISTINCT_SOURCES,
  scoutDimensions,
} from '@/contracts/values'

import type { ScoutBand, ScoutDimension, ScoutEvidenceField } from './scout-types'

/** Evidence older than this is stale even if nothing has replaced it. */
const ACTIVITY_RECENT_DAYS = 180
const DAY = 24 * 60 * 60 * 1000

/**
 * Which source an observation came from.
 *
 * Counted by registrable domain rather than by URL, because an organisation's
 * profile page, its repository, and its issue tracker are three pages and one
 * source. Counting URLs would let a candidate clear the two-source gate on the
 * strength of one account, which is the exact failure the gate exists to stop.
 */
function sourceIdentity(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname.split('.').slice(-2).join('.')
  } catch {
    return url
  }
}

/**
 * Which fields answer which question.
 *
 * A field feeds exactly one dimension. Letting repository activity count for
 * both "is this current" and "is this relevant" would report one observation
 * twice and make a single source look like agreement between several.
 */
const dimensionFields: Record<ScoutDimension, ScoutEvidenceField[]> = {
  technical_relevance: ['theme_match'],
  current_activity: ['recent_release'],
  open_collaboration: [
    'public_repository',
    'public_documentation',
    'contribution_path',
  ],
  ecosystem_adjacency: ['ecosystem_relation'],
}

const dimensionLabels: Record<ScoutDimension, string> = {
  technical_relevance: 'Technical relevance',
  current_activity: 'Current activity',
  open_collaboration: 'Open collaboration surface',
  ecosystem_adjacency: 'Ecosystem adjacency',
}

export interface ScoutAssessmentResult {
  rubricVersion: string
  gate: 'sufficient' | 'insufficient' | 'conflicted'
  gateReason: string
  dimensions: ScoutDimensionResult[]
  conflicts: ScoutConflict[]
  distinctSources: number
}

function isLive(evidence: ScoutEvidence, now: number): boolean {
  if (evidence.supersededAt) return false
  if (!evidence.expiresAt) return true
  return new Date(evidence.expiresAt).getTime() > now
}

function isRecent(evidence: ScoutEvidence, now: number): boolean {
  return (
    now - new Date(evidence.observedAt).getTime() < ACTIVITY_RECENT_DAYS * DAY
  )
}

/**
 * A band from what the evidence is, not from how much of it there is.
 *
 * `strong` needs an exact value from a live source. `moderate` accepts a
 * derived one, because reading a release date off a changelog is a different
 * kind of claim from the organisation stating its own purpose. `weak` means
 * something was found and it is either ambiguous or old enough that nobody
 * should rely on it without looking.
 */
function bandFor(evidence: ScoutEvidence[], now: number): ScoutBand {
  if (evidence.length === 0) return 'unevidenced'

  const exact = evidence.filter(
    (item) => item.certainty === 'exact' && isRecent(item, now)
  )
  if (exact.length > 0) return 'strong'

  const derived = evidence.filter(
    (item) => item.certainty === 'derived' && isRecent(item, now)
  )
  if (derived.length > 0) return 'moderate'

  return 'weak'
}

function reasonFor(
  dimension: ScoutDimension,
  band: ScoutBand,
  evidence: ScoutEvidence[],
  now: number
): string {
  const label = dimensionLabels[dimension]

  if (band === 'unevidenced') {
    return `${label}: nothing recorded from an approved source.`
  }

  const stale = evidence.filter((item) => !isRecent(item, now)).length
  const sources = new Set(evidence.map((item) => sourceIdentity(item.sourceUrl))).size
  const staleNote =
    stale > 0 ? `, ${stale} of them older than ${ACTIVITY_RECENT_DAYS} days` : ''

  return `${label}: ${evidence.length} live observation${
    evidence.length === 1 ? '' : 's'
  } across ${sources} source${sources === 1 ? '' : 's'}${staleNote}.`
}

/**
 * Fields where two live observations disagree.
 *
 * Recorded per field rather than as a flag on the candidate: a reviewer told
 * only that "something conflicts" has to open every source to find out which,
 * which is the work the evidence was supposed to save.
 */
function findConflicts(evidence: ScoutEvidence[]): ScoutConflict[] {
  const byField = new Map<ScoutEvidenceField, ScoutEvidence[]>()

  for (const item of evidence) {
    const existing = byField.get(item.field) ?? []
    byField.set(item.field, [...existing, item])
  }

  return [...byField.entries()].flatMap(([field, items]) => {
    const values = [...new Set(items.map((item) => item.value))]
    if (values.length < 2) return []
    return [{ field, values, evidenceIds: items.map((item) => item.id) }]
  })
}

/**
 * Calculates the rubric.
 *
 * There is no total and there is no ranking number. The output is a band per
 * dimension with the evidence behind it, plus a gate saying whether the
 * evidence was good enough to look at. A single figure would be compared
 * between candidates whose evidence has nothing in common, and would end up
 * standing in for the partnership decision it is explicitly not.
 */
export function assessCandidate(
  evidence: readonly ScoutEvidence[],
  now: number = Date.now()
): ScoutAssessmentResult {
  const live = evidence.filter((item) => isLive(item, now))
  const distinctSources = new Set(
    live.map((item) => sourceIdentity(item.sourceUrl))
  ).size
  const conflicts = findConflicts(live)

  const dimensions = scoutDimensions.map((dimension) => {
    const fields = dimensionFields[dimension]
    const relevant = live.filter((item) => fields.includes(item.field))
    const band = bandFor(relevant, now)

    return {
      dimension,
      band,
      reason: reasonFor(dimension, band, relevant, now),
      evidenceIds: relevant.map((item) => item.id),
    }
  })

  const evidenced = dimensions.filter(
    (result) => result.band !== 'unevidenced'
  ).length

  if (conflicts.length > 0) {
    return {
      rubricVersion: CURRENT_SCOUT_RUBRIC_VERSION,
      gate: 'conflicted',
      gateReason:
        conflicts.length === 1
          ? 'One field carries disagreeing live evidence. Resolve it before judging fit.'
          : `${conflicts.length} fields carry disagreeing live evidence. Resolve them before judging fit.`,
      dimensions,
      conflicts,
      distinctSources,
    }
  }

  if (distinctSources < SCOUT_MIN_DISTINCT_SOURCES) {
    return {
      rubricVersion: CURRENT_SCOUT_RUBRIC_VERSION,
      gate: 'insufficient',
      gateReason:
        distinctSources === 1
          ? `Everything recorded comes from one source. ${SCOUT_MIN_DISTINCT_SOURCES} independent sources are required before fit is assessed.`
          : `Evidence comes from ${distinctSources} sources; ${SCOUT_MIN_DISTINCT_SOURCES} independent ones are required before fit is assessed.`,
      dimensions,
      conflicts,
      distinctSources,
    }
  }

  if (evidenced === 0) {
    return {
      rubricVersion: CURRENT_SCOUT_RUBRIC_VERSION,
      gate: 'insufficient',
      gateReason: 'No dimension has live evidence behind it.',
      dimensions,
      conflicts,
      distinctSources,
    }
  }

  return {
    rubricVersion: CURRENT_SCOUT_RUBRIC_VERSION,
    gate: 'sufficient',
    gateReason: `${evidenced} of ${scoutDimensions.length} dimensions have live evidence, from ${distinctSources} independent sources.`,
    dimensions,
    conflicts,
    distinctSources,
  }
}

/**
 * Inbox order.
 *
 * Conflicts first because they are the only thing a reviewer can resolve that
 * nobody else can; then candidates ready to decide; then the ones waiting on
 * evidence, which are a research task rather than a decision. Within a group,
 * the most recently observed comes first.
 */
export function reviewOrder(gate: ScoutAssessmentResult['gate'] | null): number {
  if (gate === 'conflicted') return 0
  if (gate === 'sufficient') return 1
  if (gate === 'insufficient') return 2
  return 3
}
