import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { fetchBasecampReleaseDownloads } from '@repo/content/basecamp'

import { env } from '../lib/env'

async function main(): Promise<void> {
  const release = await fetchBasecampReleaseDownloads({
    token: env.GITHUB_TOKEN,
  })
  const outputPath = join(
    import.meta.dirname,
    '..',
    'lib/data/basecamp-release.snapshot.json'
  )
  writeFileSync(outputPath, `${JSON.stringify(release, null, 2)}\n`)
  console.info(
    `[sync-basecamp-release] refreshed all four downloads from ${release.tag}`
  )
}

main().catch((error: unknown) => {
  console.error(
    '[sync-basecamp-release] failed; refusing to build with stale downloads.',
    error
  )
  process.exitCode = 1
})
