import { desc, eq, inArray } from 'drizzle-orm'

import type { ScoutDiscoveryRun } from '@/contracts/scout'
import { recordAuditEvent } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import { scoutCandidates, scoutDiscoveryRuns } from '@/server/db/schema'
import { discoverableCandidates } from '@/server/db/scout-fixtures'
import { insertScoutCandidate } from '@/server/db/seed-scout'
import { discoverFromSources } from '@/server/scout/discover-from-sources'
import { areSourcesEnabled } from '@/server/scout/source-fetch'
import { getScoutDiscoveryBrief } from '@/server/scout-brief-repository'
import {
  buildSourceQuery,
  rankSyntheticCandidates,
  type ScoutTargetProfile,
} from '@/server/scout-target-profile'

/** How many candidates one run surfaces, so a demo grows rather than dumps. */
const BATCH_SIZE = 3

type DiscoveryRunRow = typeof scoutDiscoveryRuns.$inferSelect

function toRun(row: DiscoveryRunRow): ScoutDiscoveryRun {
  return {
    id: row.id,
    briefId: row.briefId,
    mode: row.mode,
    discoveredCount: row.discoveredCount,
    quarantinedCount: row.quarantinedCount,
    skippedCount: row.skippedCount,
    failureCount: row.failureCount,
    sourcesUsed: row.sourcesUsed as string[],
    note: row.note,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  }
}

export interface DiscoveryResult {
  run: ScoutDiscoveryRun
  discovered: string[]
}

/**
 * Runs synthetic discovery.
 *
 * This is a fixture, not a crawler: it draws the next few invented
 * organisations from a built-in catalogue and makes no network call. It exists
 * so the review loop can be shown end to end - a queue that only ever holds
 * the same six rows cannot demonstrate what reviewing feels like when new work
 * keeps arriving.
 *
 * The shape is the one a real adapter will have to fit: a recorded run, a
 * count of what was added, a count of what was discarded as a natural person,
 * and no path that decides anything on the reviewer's behalf.
 */
export async function runSyntheticDiscovery(
  actor: Readonly<ActorContext>
): Promise<DiscoveryResult> {
  return runDiscovery(actor, { mode: 'synthetic' })
}

export interface DiscoveryRequest {
  query?: string
  mode?: 'synthetic' | 'sources'
  briefId?: string
}

function targetFromQuery(query = ''): ScoutTargetProfile {
  return {
    query,
    organisationTypes: [],
    themes: [],
    exclusions: [],
    regions: [],
    activeWithinMonths: null,
  }
}

/**
 * Runs discovery.
 *
 * Which mode runs is decided here rather than by the caller: a browser asking
 * for a real run against a deployment with no approved sources should get the
 * synthetic catalogue and be told, not an error and not a silent nothing.
 */
export async function runDiscovery(
  actor: Readonly<ActorContext>,
  request: Readonly<DiscoveryRequest> = {}
): Promise<DiscoveryResult> {
  const wantsSources = request.mode !== 'synthetic' && areSourcesEnabled()
  const brief = request.briefId
    ? await getScoutDiscoveryBrief(request.briefId)
    : null
  const query = request.query ?? brief?.query
  const target = brief ?? targetFromQuery(query)

  if (wantsSources && query) {
    return runSourceDiscovery(actor, target, brief?.id ?? null)
  }

  return runCatalogueDiscovery(actor, target, wantsSources, brief?.id ?? null)
}

async function runSourceDiscovery(
  actor: Readonly<ActorContext>,
  target: Readonly<ScoutTargetProfile>,
  briefId: string | null
): Promise<DiscoveryResult> {
  const query = buildSourceQuery(target)
  const outcome = await discoverFromSources(target)

  const parts = [
    outcome.discovered.length > 0
      ? `Found ${outcome.discovered.length} ${outcome.discovered.length === 1 ? 'organisation' : 'organisations'} for "${query}" through ${outcome.sourcesUsed.join(' and ')}.`
      : `No new organisations for "${query}".`,
    outcome.quarantined === 1
      ? 'One subject was a personal account and was quarantined with nothing stored.'
      : outcome.quarantined > 1
        ? `${outcome.quarantined} subjects were personal accounts and were quarantined with nothing stored.`
        : '',
    outcome.skipped > 0
      ? `${outcome.skipped} did not meet the target or were already in the queue.`
      : '',
    ...outcome.failures,
  ].filter(Boolean)

  const [row] = await db
    .insert(scoutDiscoveryRuns)
    .values({
      mode: 'sources',
      requestedByUserId: actor.userId,
      requestId: actor.requestId,
      briefId,
      discoveredCount: outcome.discovered.length,
      quarantinedCount: outcome.quarantined,
      skippedCount: outcome.skipped,
      failureCount: outcome.failures.length,
      sourcesUsed: outcome.sourcesUsed,
      note: parts.join(' '),
      finishedAt: new Date(),
    })
    .returning()

  if (!row) throw new Error('The discovery run was not recorded.')

  await db.transaction(async (transaction) => {
    await recordAuditEvent(transaction, actor, {
      action: 'scout.discovery.run',
      entityType: 'scout_candidate',
      entityId: row.id,
      summary: `sources: ${query}`,
    })
  })

  return { run: toRun(row), discovered: outcome.discovered }
}

async function runCatalogueDiscovery(
  actor: Readonly<ActorContext>,
  target: Readonly<ScoutTargetProfile>,
  sourcesWanted: boolean,
  briefId: string | null
): Promise<DiscoveryResult> {
  const existing = await db
    .select({ normalisedName: scoutCandidates.normalisedName })
    .from(scoutCandidates)

  const known = new Set(existing.map((row) => row.normalisedName))
  const remaining = rankSyntheticCandidates(
    discoverableCandidates.filter(
      (seed) => !known.has(seed.displayName.toLocaleLowerCase('en'))
    ),
    target
  )
  const batch = remaining.slice(0, BATCH_SIZE)

  const createdIds: string[] = []
  for (const seed of batch) {
    const id = await insertScoutCandidate(seed)
    if (id) createdIds.push(id)
  }

  const quarantined = batch.filter(
    (seed) => seed.reviewState === 'quarantined'
  ).length

  const missingQuery = sourcesWanted
    ? ' Type a search term to run the approved sources instead.'
    : ''

  const note =
    batch.length === 0
      ? target.query
        ? `No synthetic examples match this target.${missingQuery || ' Enable approved sources to search live public evidence.'}`
        : `The synthetic catalogue is exhausted.${missingQuery || ' Enable approved sources to search live public evidence.'}`
      : `Added ${createdIds.length} synthetic ${
          createdIds.length === 1 ? 'candidate' : 'candidates'
        } from the built-in catalogue. No external source was contacted.${missingQuery}`

  const [row] = await db
    .insert(scoutDiscoveryRuns)
    .values({
      mode: 'synthetic',
      requestedByUserId: actor.userId,
      requestId: actor.requestId,
      briefId,
      discoveredCount: createdIds.length,
      quarantinedCount: quarantined,
      skippedCount: 0,
      failureCount: 0,
      sourcesUsed: ['Synthetic catalogue'],
      note,
      finishedAt: new Date(),
    })
    .returning()

  if (!row) throw new Error('The discovery run was not recorded.')

  await db.transaction(async (transaction) => {
    await recordAuditEvent(transaction, actor, {
      action: 'scout.discovery.run',
      entityType: 'scout_candidate',
      entityId: row.id,
      summary: note,
    })
  })

  return { run: toRun(row), discovered: createdIds }
}

export async function listRecentDiscoveryRuns(
  limit = 5
): Promise<ScoutDiscoveryRun[]> {
  const rows = await db
    .select()
    .from(scoutDiscoveryRuns)
    .orderBy(desc(scoutDiscoveryRuns.startedAt))
    .limit(limit)

  return rows.map(toRun)
}

/**
 * Names the candidates a bulk decision cannot touch.
 *
 * Quarantined and accepted candidates are refused individually, and a bulk
 * action that silently skipped them would report a number the reviewer cannot
 * reconcile with what they selected.
 */
export async function findUndecidableCandidates(
  candidateIds: readonly string[]
): Promise<string[]> {
  if (candidateIds.length === 0) return []

  const rows = await db
    .select({
      displayName: scoutCandidates.displayName,
      reviewState: scoutCandidates.reviewState,
    })
    .from(scoutCandidates)
    .where(inArray(scoutCandidates.id, [...candidateIds]))

  return rows
    .filter(
      (row) =>
        row.reviewState === 'quarantined' || row.reviewState === 'accepted'
    )
    .map((row) => row.displayName)
}

export async function countCandidatesInState(
  state: (typeof scoutCandidates.$inferSelect)['reviewState']
): Promise<number> {
  const rows = await db
    .select({ id: scoutCandidates.id })
    .from(scoutCandidates)
    .where(eq(scoutCandidates.reviewState, state))

  return rows.length
}
