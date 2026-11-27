import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { syncBroadcastEventsSnapshot } from '../broadcast-events-snapshot'
import snapshot from '../data/broadcast-events.snapshot.json'

const state = vi.hoisted(() => ({
  BROADCAST_EVENTS_SNAPSHOT: undefined as string | undefined,
  ALLOW_CONTENT_FETCH_FAILURE: false,
  ALLOW_BROADCAST_EVENTS_FETCH_FAILURE: false,
}))
vi.mock('@/lib/env', () => ({ env: state }))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }))

let directory: string
let filename: string

beforeEach(async () => {
  state.BROADCAST_EVENTS_SNAPSHOT = undefined
  state.ALLOW_CONTENT_FETCH_FAILURE = false
  state.ALLOW_BROADCAST_EVENTS_FETCH_FAILURE = false
  directory = await mkdtemp(join(tmpdir(), 'broadcast-events-'))
  filename = join(directory, 'events.json')
  await writeFile(filename, JSON.stringify(snapshot))
})

afterEach(async () => {
  vi.restoreAllMocks()
  await rm(directory, { recursive: true, force: true })
})

describe('broadcast event snapshot refresh', () => {
  test('reuses the reviewed staging snapshot without fetching or changing its capture time', async () => {
    const reviewed = join(directory, 'reviewed.json')
    await writeFile(reviewed, JSON.stringify({ ...snapshot, data: [] }))
    state.BROADCAST_EVENTS_SNAPSHOT = reviewed
    const network = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Offline'))
    await syncBroadcastEventsSnapshot(filename)
    expect(JSON.parse(await readFile(filename, 'utf8'))).toEqual({
      ...snapshot,
      data: [],
    })
    expect(network).not.toHaveBeenCalled()
  })

  test('fails on an invalid reviewed snapshot instead of fetching different live data', async () => {
    state.BROADCAST_EVENTS_SNAPSHOT = filename
    await writeFile(
      filename,
      JSON.stringify({ ...snapshot, generatedAt: 'invalid' })
    )
    const network = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json(snapshot))
    await expect(syncBroadcastEventsSnapshot(filename)).rejects.toThrow()
    expect(network).not.toHaveBeenCalled()
  })

  test('writes validated public fields and a capture time', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        success: true,
        data: [{ ...snapshot.data[0], totalPlaysDuringOrganic: 100 }],
      })
    )
    const now = new Date('2026-11-28T00:00:00.000Z')
    await syncBroadcastEventsSnapshot(filename, now)
    expect(JSON.parse(await readFile(filename, 'utf8'))).toEqual({
      generatedAt: now.toISOString(),
      success: true,
      data: [snapshot.data[0]],
    })
  })

  test('records a successful empty list so deleted events do not return', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ success: true, data: [] })
    )
    await syncBroadcastEventsSnapshot(filename)
    expect(JSON.parse(await readFile(filename, 'utf8')).data).toEqual([])
  })

  test('fails by default and does not overwrite the snapshot on a 403', async () => {
    const before = await readFile(filename, 'utf8')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Sign in', { status: 403 })
    )
    await expect(syncBroadcastEventsSnapshot(filename)).rejects.toThrow('403')
    expect(await readFile(filename, 'utf8')).toBe(before)
  })

  test.each([
    'ALLOW_CONTENT_FETCH_FAILURE',
    'ALLOW_BROADCAST_EVENTS_FETCH_FAILURE',
  ] as const)(
    'keeps the last valid snapshot when %s is enabled',
    async (flag) => {
      state[flag] = true
      const before = await readFile(filename, 'utf8')
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('Failed to fetch')
      )
      await syncBroadcastEventsSnapshot(filename)
      expect(await readFile(filename, 'utf8')).toBe(before)
    }
  )

  test.each([
    '<html>Sign in</html>',
    JSON.stringify({ success: true, data: [{ date: 'invalid' }] }),
  ])(
    'does not replace the snapshot with a malformed response',
    async (body) => {
      state.ALLOW_CONTENT_FETCH_FAILURE = true
      const before = await readFile(filename, 'utf8')
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body))
      await syncBroadcastEventsSnapshot(filename)
      expect(await readFile(filename, 'utf8')).toBe(before)
    }
  )

  test('requires a valid existing snapshot even when fallback is enabled', async () => {
    state.ALLOW_CONTENT_FETCH_FAILURE = true
    await writeFile(filename, JSON.stringify({ success: false, data: [] }))
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'))
    await expect(syncBroadcastEventsSnapshot(filename)).rejects.toThrow()
  })
})
