import {
  parseBroadcastEvents,
  type BroadcastEventRow,
} from '@repo/content/calendar'

import { env } from '@/lib/env'

const API_ORIGIN =
  env.NEXT_PUBLIC_ADMIN_ACID_API_URL ?? 'https://admin-acid.logos.co/api'

export async function getBroadcastEvents(
  signal?: AbortSignal
): Promise<BroadcastEventRow[]> {
  const response = await fetch(`${API_ORIGIN}/calendar/public`, {
    cache: 'no-store',
    signal,
  })
  if (!response.ok) {
    throw new Error(`Broadcast calendar request failed: ${response.status}`)
  }

  return parseBroadcastEvents(await response.json())
}
