import { afterEach, expect, it, vi } from 'vitest'

import { submitToN8n } from '../submit'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('returns a best-effort failure when the webhook request times out', async () => {
  vi.stubEnv('N8N_STEWARD_WEBHOOK_TOKEN', 'test-token')
  const controller = new AbortController()
  vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(init.signal?.reason),
            {
              once: true,
            }
          )
        })
    )
  )

  const result = submitToN8n({}, 'afformActivistLeaderSteward')
  controller.abort(new DOMException('Webhook timed out', 'TimeoutError'))

  await expect(result).resolves.toEqual({
    ok: false,
    message: 'Webhook timed out',
  })
})
