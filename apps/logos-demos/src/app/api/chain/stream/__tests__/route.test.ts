import { afterEach, describe, expect, it, vi } from 'vitest'

import { GET, MAX_CONCURRENT_STREAMS } from '../route'

function hangingBody() {
  return new ReadableStream<Uint8Array>({ start() {} })
}

describe('GET /api/chain/stream', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('refuses streams beyond the cap and frees a slot on disconnect', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(hangingBody()))
    )

    const clients = Array.from(
      { length: MAX_CONCURRENT_STREAMS },
      () => new AbortController()
    )
    for (const client of clients) {
      const response = await GET(
        new Request('http://localhost/api/chain/stream', {
          signal: client.signal,
        })
      )
      expect(response.status).toBe(200)
    }

    const refused = await GET(new Request('http://localhost/api/chain/stream'))
    expect(refused.status).toBe(503)

    clients[0]!.abort()
    const reopened = new AbortController()
    const response = await GET(
      new Request('http://localhost/api/chain/stream', {
        signal: reopened.signal,
      })
    )
    expect(response.status).toBe(200)

    for (const client of [...clients, reopened]) client.abort()
  })

  it('does not abort the body once the connection is open', async () => {
    vi.useFakeTimers()
    let upstreamSignal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        upstreamSignal = init.signal ?? undefined
        return new Response(hangingBody())
      })
    )

    const client = new AbortController()
    await GET(
      new Request('http://localhost/api/chain/stream', {
        signal: client.signal,
      })
    )
    await vi.advanceTimersByTimeAsync(60_000)
    expect(upstreamSignal?.aborted).toBe(false)

    client.abort()
  })

  it('frees the slot when the node refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('no', { status: 500 }))
    )
    for (let i = 0; i <= MAX_CONCURRENT_STREAMS; i += 1) {
      const response = await GET(
        new Request('http://localhost/api/chain/stream')
      )
      expect(response.status).toBe(502)
    }
  })
})
