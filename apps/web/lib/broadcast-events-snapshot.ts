import { readFile } from 'node:fs/promises'
import { calendarResponseSchema } from '@repo/content/calendar'
import { z } from 'zod'

import { writeFileAtomic } from './atomic-write'
import { getBroadcastEventsResponse } from './broadcast-events-source'
import { allowContentFetchFailure } from './content-fetch-fallback'
import { env } from './env'

const snapshotSchema = calendarResponseSchema.extend({
  generatedAt: z.string().datetime(),
})

const readSnapshot = async (filename: string) =>
  snapshotSchema.parse(JSON.parse(await readFile(filename, 'utf8')))

export async function syncBroadcastEventsSnapshot(
  filename: string,
  now = new Date()
): Promise<void> {
  if (env.BROADCAST_EVENTS_SNAPSHOT) {
    const snapshot = await readSnapshot(env.BROADCAST_EVENTS_SNAPSHOT)
    await writeFileAtomic(filename, `${JSON.stringify(snapshot, null, 2)}\n`)
    return
  }
  let response: Awaited<ReturnType<typeof getBroadcastEventsResponse>>
  try {
    response = await getBroadcastEventsResponse()
  } catch (error) {
    allowContentFetchFailure(
      'Broadcast calendar',
      error,
      'ALLOW_BROADCAST_EVENTS_FETCH_FAILURE'
    )
    await readSnapshot(filename)
    return
  }

  await writeFileAtomic(
    filename,
    `${JSON.stringify({ generatedAt: now.toISOString(), ...response }, null, 2)}\n`
  )
}
