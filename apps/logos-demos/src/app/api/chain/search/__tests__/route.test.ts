import { afterEach, describe, expect, it, vi } from 'vitest'

import { LEAD_NODE } from '@/lib/chain-nodes'

import { GET } from '../route'

function search(q: string) {
  return GET(
    new Request(`http://localhost/api/chain/search?q=${encodeURIComponent(q)}`)
  )
}

describe('GET /api/chain/search', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('answers kind "none" without calling the node for a path query', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await search('../network/info#')

    expect(await response.json()).toEqual({
      kind: 'none',
      query: '../network/info#',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('only calls the block, transaction and balance paths for a hex id', async () => {
    const fetchMock = vi.fn(
      async (_url: string) => new Response(null, { status: 404 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await search('abc123')

    expect(await response.json()).toEqual({ kind: 'none', query: 'abc123' })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${LEAD_NODE}/cryptarchia/blocks/abc123`,
      `${LEAD_NODE}/cryptarchia/transaction/abc123`,
      `${LEAD_NODE}/wallet/abc123/balance`,
    ])
  })
})
