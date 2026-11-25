import { afterEach, describe, expect, it, vi } from 'vitest'

import { FLEETS } from '@/lib/storage-fleet'

import { GET } from '../route'

describe('GET /api/storage/fleet', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('bounds the roster fetch with a timeout', async () => {
    const fetchMock = vi.fn(async () => Response.json({}))
    vi.stubGlobal('fetch', fetchMock)

    await GET(
      new Request(`http://localhost/api/storage/fleet?fleet=${FLEETS[0]}`)
    )

    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
