// Refreshes the committed active-circles snapshot from the live Logos API.
//
//   pnpm --filter web sync:active-circles
//
// The snapshot (`lib/data/active-circles.snapshot.json`) is the single source
// of truth shared by the `/circles` map and the `/active-circles` list, so this
// keeps the two surfaces in sync by construction. It also runs as part of the
// web build.
//
// Resilience: if the API is unreachable or returns no circles, the script logs
// a warning, leaves the existing committed snapshot untouched, and exits 0 so
// the build can proceed with the last known-good data.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { buildActiveCirclesSnapshot } from '../lib/active-circles-source'

const OUTPUT_PATH = join(
  import.meta.dirname,
  '..',
  'lib',
  'data',
  'active-circles.snapshot.json'
)

async function main(): Promise<void> {
  const snapshot = await buildActiveCirclesSnapshot(new Date())

  if (snapshot.circles.length === 0) {
    console.warn(
      '[sync-active-circles] API returned 0 active circles — keeping the existing committed snapshot.'
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

main().catch((error: unknown) => {
  console.warn(
    '[sync-active-circles] failed to refresh snapshot — keeping the existing committed snapshot.',
    error
  )
  // Non-fatal: never break the build over a transient API failure.
})
