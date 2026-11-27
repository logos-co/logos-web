import { afterEach, describe, expect, test, vi } from 'vitest'

import { getBroadcastEventsResponse } from '../broadcast-events-source'
import snapshot from '../data/broadcast-events.snapshot.json'

const state = vi.hoisted(() => ({
  ADMIN_ACID_API_URL: undefined as string | undefined,
  ADMIN_ACID_API_AUTHORIZATION: undefined as string | undefined,
}))
vi.mock('@/lib/env', () => ({ env: state }))

afterEach(() => {
  vi.restoreAllMocks()
  state.ADMIN_ACID_API_URL = undefined
  state.ADMIN_ACID_API_AUTHORIZATION = undefined
})

describe('build-time calendar source', () => {
  test('fetches uncached data with a timeout and keeps only calendar fields', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json(snapshot))
    const result = await getBroadcastEventsResponse()
    expect(result).toEqual({ success: true, data: snapshot.data })
    expect(fetch).toHaveBeenCalledWith(
      'https://admin-acid.logos.co/api/calendar/public',
      {
        cache: 'no-store',
        headers: undefined,
        signal: expect.any(AbortSignal),
      }
    )
  })

  test('supports server-side proxy authentication and a custom source', async () => {
    state.ADMIN_ACID_API_URL = 'https://calendar.example/api'
    state.ADMIN_ACID_API_AUTHORIZATION = 'Bearer build-token'
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ success: true, data: [] }))
    expect(await getBroadcastEventsResponse()).toEqual({
      success: true,
      data: [],
    })
    expect(fetch).toHaveBeenCalledWith(
      'https://calendar.example/api/calendar/public',
      expect.objectContaining({
        headers: { Authorization: 'Bearer build-token' },
      })
    )
  })

  test.each([403, 503])(
    'rejects HTTP %i without mistaking it for an empty schedule',
    async (status) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unavailable', { status })
      )
      await expect(getBroadcastEventsResponse()).rejects.toThrow(String(status))
    }
  )

  test.each([
    '<html>Sign in with GitHub</html>',
    JSON.stringify({ success: false, data: [] }),
    JSON.stringify({
      success: true,
      data: [{ ...snapshot.data[0], date: 'invalid' }],
    }),
  ])('rejects malformed responses', async (body) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body))
    await expect(getBroadcastEventsResponse()).rejects.toThrow()
  })
})
