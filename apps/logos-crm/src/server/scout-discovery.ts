import { desc, eq, inArray } from 'drizzle-orm'

import type { ScoutDiscoveryRun } from '@/contracts/scout'
import { recordAuditEvent } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import { scoutCandidates, scoutDiscoveryRuns } from '@/server/db/schema'
import { discoverableCandidates } from '@/server/db/scout-fixtures'
import { insertScoutCandidate } from '@/server/db/seed-scout'

/** How many candidates one run surfaces, so a demo grows rather than dumps. */
const BATCH_SIZE = 3

type DiscoveryRunRow = typeof scoutDiscoveryRuns.$inferSelect

function toRun(row: DiscoveryRunRow): ScoutDiscoveryRun {
  return {
    id: row.id,
    mode: row.mode,
    discoveredCount: row.discoveredCount,
    quarantinedCount: row.quarantinedCount,
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
  const existing = await db
    .select({ normalisedName: scoutCandidates.normalisedName })
    .from(scoutCandidates)

  const known = new Set(existing.map((row) => row.normalisedName))
  const remaining = discoverableCandidates.filter(
    (seed) => !known.has(seed.displayName.toLocaleLowerCase('en'))
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

  const note =
    batch.length === 0
      ? 'The synthetic catalogue is exhausted. A real run needs an approved source adapter, which does not exist yet.'
      : `Added ${createdIds.length} synthetic ${
          createdIds.length === 1 ? 'candidate' : 'candidates'
        } from the built-in catalogue. No external source was contacted.`

  const [row] = await db
    .insert(scoutDiscoveryRuns)
    .values({
      mode: 'synthetic',
      requestedByUserId: actor.userId,
      requestId: actor.requestId,
      discoveredCount: createdIds.length,
      quarantinedCount: quarantined,
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
