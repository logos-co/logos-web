import { calendarResponseSchema } from '@repo/content/calendar'

import { env } from './env'

export async function getBroadcastEventsResponse() {
  const origin = env.ADMIN_ACID_API_URL ?? 'https://admin-acid.logos.co/api'
  const response = await fetch(`${origin}/calendar/public`, {
    cache: 'no-store',
    headers: env.ADMIN_ACID_API_AUTHORIZATION
      ? { Authorization: env.ADMIN_ACID_API_AUTHORIZATION }
      : undefined,
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(`Broadcast calendar request failed: ${response.status}`)
  }

  return calendarResponseSchema.parse(await response.json())
}
