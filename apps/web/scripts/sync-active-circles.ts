// Refreshes the committed active-circles snapshot from the live Logos API.
//
//   pnpm --filter web sync:active-circles
//
// The snapshot (`lib/data/active-circles.snapshot.json`) is the single source
// of truth shared by the `/circles` map and the `/active-circles` list, so this
// keeps the two surfaces in sync by construction. It also runs as part of the
// web build.
//
// Failures follow the same rule as the blog CMS: an unreachable API fails the
// build, unless ALLOW_CONTENT_FETCH_FAILURE=1, in which case the existing
// committed snapshot is kept. An API that answers with no circles at all keeps
// the committed snapshot too.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { buildActiveCirclesSnapshot } from '../lib/active-circles-source'
import type { ActiveCirclesSnapshot } from '../lib/active-circles-shared'
import { allowContentFetchFailure } from '../lib/content-fetch-fallback'

const OUTPUT_PATH = join(
  import.meta.dirname,
  '..',
  'lib',
  'data',
  'active-circles.snapshot.json'
)

async function main(): Promise<void> {
  let snapshot: ActiveCirclesSnapshot
  try {
    snapshot = await buildActiveCirclesSnapshot(new Date())
  } catch (error) {
    allowContentFetchFailure('Active circles', error)
    return
  }

  if (snapshot.circles.length === 0) {
    console.warn(
      '[sync-active-circles] API returned 0 active circles, keeping the existing committed snapshot.'
    )
    return
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`)

  console.log(
    `[sync-active-circles] wrote ${snapshot.circles.length} active circles ` +
      `(active since ${snapshot.activeSinceDate}) to ${OUTPUT_PATH}`
  )
}

await main()
