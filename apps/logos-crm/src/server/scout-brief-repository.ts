import { desc, eq } from 'drizzle-orm'

import type {
  CreateScoutDiscoveryBriefInput,
  ScoutDiscoveryBrief,
} from '@/contracts/scout'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import { scoutDiscoveryBriefs } from '@/server/db/schema'
import { notFound } from '@/server/service-errors'

type BriefRow = typeof scoutDiscoveryBriefs.$inferSelect

function toBrief(row: BriefRow): ScoutDiscoveryBrief {
  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    query: row.query,
    organisationTypes:
      row.organisationTypes as ScoutDiscoveryBrief['organisationTypes'],
    themes: row.themes as ScoutDiscoveryBrief['themes'],
    exclusions: row.exclusions as ScoutDiscoveryBrief['exclusions'],
    regions: row.regions as ScoutDiscoveryBrief['regions'],
    activeWithinMonths: row.activeWithinMonths,
    sourceTypes: row.sourceTypes as ScoutDiscoveryBrief['sourceTypes'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listScoutDiscoveryBriefs(): Promise<
  ScoutDiscoveryBrief[]
> {
  const rows = await db
    .select()
    .from(scoutDiscoveryBriefs)
    .orderBy(desc(scoutDiscoveryBriefs.updatedAt))

  return rows.map(toBrief)
}

export async function getScoutDiscoveryBrief(
  briefId: string
): Promise<ScoutDiscoveryBrief> {
  const [row] = await db
    .select()
    .from(scoutDiscoveryBriefs)
    .where(eq(scoutDiscoveryBriefs.id, briefId))
    .limit(1)

  if (!row) throw notFound('That discovery brief no longer exists.')
  return toBrief(row)
}

export async function createScoutDiscoveryBrief(
  actor: Readonly<ActorContext>,
  input: Readonly<CreateScoutDiscoveryBriefInput>
): Promise<ScoutDiscoveryBrief> {
  const [row] = await db
    .insert(scoutDiscoveryBriefs)
    .values({ ...input, createdByUserId: actor.userId })
    .returning()

  if (!row) throw new Error('The discovery brief was not stored.')
  return toBrief(row)
}
