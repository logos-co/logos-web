import { setTimeout } from 'node:timers/promises'

const siteUrl = process.env.SITE_URL
if (siteUrl !== 'https://dev.logos.co' && siteUrl !== 'https://logos.co')
  throw new Error('Invalid site URL')
const runId = Number(process.env.GITHUB_RUN_ID)
if (!Number.isSafeInteger(runId) || runId < 1)
  throw new Error('Invalid workflow run ID')
let updated = false
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    const response = await fetch(`${siteUrl}/site-publish.json?run=${runId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (response.ok) {
      const marker: unknown = await response.json()
      if (
        marker &&
        typeof marker === 'object' &&
        'runId' in marker &&
        marker.runId === runId
      ) {
        updated = true
        break
      }
    }
  } catch {
    // The existing site synchronisation may briefly serve the previous export.
  }
  await setTimeout(5000)
}
if (!updated)
  throw new Error(
    'The deployment branch was updated, but the website did not confirm the new build. Check its Git webhook and synchronisation.'
  )
