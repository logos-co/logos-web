import { isNull } from 'drizzle-orm'

import { db } from '@/server/db'
import {
  scoutAssessments,
  scoutCandidates,
  scoutDiscoveryRuns,
  scoutEvents,
  scoutReviews,
} from '@/server/db/schema'

export interface ScoutReport {
  candidateStates: Record<string, number>
  evidenceGates: Record<string, number>
  decisions: Record<string, number>
  events: Record<string, number>
  reviewTiming: {
    measuredReviews: number
    medianMinutes: number | null
  }
  discovery: {
    runs: number
    discovered: number
    quarantined: number
    duplicates: number
    failures: number
  }
  generatedAt: string
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1
}

function reportReviewTiming(
  events: ReadonlyArray<{
    eventType: string
    candidateId: string | null
    actorUserId: string | null
    occurredAt: Date
  }>
): ScoutReport['reviewTiming'] {
  const latestOpen = new Map<string, Date>()
  const durations: number[] = []

  for (const event of [...events].sort(
    (left, right) => left.occurredAt.getTime() - right.occurredAt.getTime()
  )) {
    if (!event.candidateId || !event.actorUserId) continue
    const key = `${event.candidateId}:${event.actorUserId}`

    if (event.eventType === 'candidate_opened') {
      latestOpen.set(key, event.occurredAt)
      continue
    }

    if (event.eventType !== 'review_recorded') continue
    const openedAt = latestOpen.get(key)
    if (!openedAt) continue

    const durationMinutes =
      (event.occurredAt.getTime() - openedAt.getTime()) / 60_000
    latestOpen.delete(key)

    // Long-idle tabs are not active review time and would make this aggregate
    // misleading. Eight hours still admits a long working session without
    // turning an overnight tab into a performance metric.
    if (durationMinutes >= 0 && durationMinutes <= 8 * 60) {
      durations.push(durationMinutes)
    }
  }

  durations.sort((left, right) => left - right)
  const middle = Math.floor(durations.length / 2)
  const median =
    durations.length === 0
      ? null
      : durations.length % 2 === 0
        ? ((durations[middle - 1] ?? 0) + (durations[middle] ?? 0)) / 2
        : (durations[middle] ?? null)

  return {
    measuredReviews: durations.length,
    medianMinutes: median === null ? null : Math.round(median * 10) / 10,
  }
}

export async function getScoutReport(): Promise<ScoutReport> {
  const [candidates, assessments, reviews, events, runs] = await Promise.all([
    db.select({ state: scoutCandidates.reviewState }).from(scoutCandidates),
    db
      .select({ gate: scoutAssessments.gate })
      .from(scoutAssessments)
      .where(isNull(scoutAssessments.supersededAt)),
    db.select({ decision: scoutReviews.decision }).from(scoutReviews),
    db
      .select({
        eventType: scoutEvents.eventType,
        candidateId: scoutEvents.candidateId,
        actorUserId: scoutEvents.actorUserId,
        occurredAt: scoutEvents.occurredAt,
      })
      .from(scoutEvents),
    db
      .select({
        discovered: scoutDiscoveryRuns.discoveredCount,
        quarantined: scoutDiscoveryRuns.quarantinedCount,
        duplicates: scoutDiscoveryRuns.skippedCount,
        failures: scoutDiscoveryRuns.failureCount,
      })
      .from(scoutDiscoveryRuns),
  ])

  const candidateStates: Record<string, number> = {}
  for (const candidate of candidates)
    increment(candidateStates, candidate.state)

  const evidenceGates: Record<string, number> = {}
  for (const assessment of assessments)
    increment(evidenceGates, assessment.gate)

  const decisions: Record<string, number> = {}
  for (const review of reviews) increment(decisions, review.decision)

  const eventCounts: Record<string, number> = {}
  for (const event of events) increment(eventCounts, event.eventType)

  return {
    candidateStates,
    evidenceGates,
    decisions,
    events: eventCounts,
    reviewTiming: reportReviewTiming(events),
    discovery: runs.reduce<ScoutReport['discovery']>(
      (total, run) => ({
        runs: total.runs + 1,
        discovered: total.discovered + run.discovered,
        quarantined: total.quarantined + run.quarantined,
        duplicates: total.duplicates + run.duplicates,
        failures: total.failures + run.failures,
      }),
      { runs: 0, discovered: 0, quarantined: 0, duplicates: 0, failures: 0 }
    ),
    generatedAt: new Date().toISOString(),
  }
}
