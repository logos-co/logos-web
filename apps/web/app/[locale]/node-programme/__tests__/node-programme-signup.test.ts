import { afterEach, describe, expect, test, vi } from 'vitest'

import { submitNodeProgrammeSignup } from '../node-programme-signup'

describe('submitNodeProgrammeSignup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('uses the footer newsletter payload without a city field', async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await submitNodeProgrammeSignup({
      email: 'node@example.com',
      role: 'Node operator',
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
      note: 'Role: Node operator',
    })
  })
})
