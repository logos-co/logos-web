import { afterEach, describe, expect, test, vi } from 'vitest'

import { submitNodeProgrammeSignup } from '../node-programme-signup'

describe('submitNodeProgrammeSignup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('subscribes with only an email and identifies the node programme source', async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await submitNodeProgrammeSignup({
      email: 'node@example.com',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { body: string; method: string },
    ]
    expect(JSON.parse(init.body)).toEqual({
      email: 'node@example.com',
      type: 'logos',
      newsletter: '6913441fee2f120001cec90d',
      note: 'Source: Node programme',
    })
  })
})
