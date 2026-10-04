import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'
import { createSitePublishHandlers } from '../handlers'
import { PublishBlockedError } from '../trigger-publish'

const request = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest('https://cms.example.com/api/site-publish', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      origin: 'https://cms.example.com',
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/json',
      ...headers,
    },
  })
const setup = (authenticated = true) => {
  const submitted: unknown[] = []
  return {
    submitted,
    handlers: createSitePublishHandlers({
      authenticate: async () => authenticated,
      loadPublishStatus: async () => {
        throw new Error('not configured')
      },
      triggerPublish: async (...args) => {
        submitted.push(args)
        return { environment: args[0], label: 'test' }
      },
    }),
  }
}
describe('site publish HTTP handlers', () => {
  it('checks authentication before accessing deployment configuration', async () => {
    const { handlers, submitted } = setup(false)
    assert.equal((await handlers.GET(request({}))).status, 401)
    assert.equal(
      (await handlers.POST(request({ environment: 'dev' }))).status,
      401
    )
    assert.deepEqual(submitted, [])
  })
  it('rejects cross-origin and non-JSON requests', async () => {
    const invalidHeaders: Array<Record<string, string>> = [
      { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
      { 'content-type': 'text/plain' },
    ]
    for (const headers of invalidHeaders) {
      const { handlers, submitted } = setup()
      assert.equal(
        (await handlers.POST(request({ environment: 'dev' }, headers))).status,
        403
      )
      assert.deepEqual(submitted, [])
    }
  })
  it('requires an environment and a positive reviewed build for production', async () => {
    for (const body of [
      null,
      {},
      { environment: 'invalid' },
      { environment: 'production' },
      { environment: 'production', previewBuild: -1 },
    ]) {
      assert.equal((await setup().handlers.POST(request(body))).status, 400)
    }
  })
  it('accepts a reviewed production request', async () => {
    const { handlers, submitted } = setup()
    assert.equal(
      (
        await handlers.POST(
          request({ environment: 'production', previewBuild: 42 })
        )
      ).status,
      202
    )
    assert.deepEqual(submitted, [['production', 42]])
  })
  it('returns a conflict for a stale preview', async () => {
    const handlers = createSitePublishHandlers({
      authenticate: async () => true,
      loadPublishStatus: setup().handlers.GET as never,
      triggerPublish: async () => {
        throw new PublishBlockedError('Review the latest preview')
      },
    })
    assert.equal(
      (
        await handlers.POST(
          request({ environment: 'production', previewBuild: 42 })
        )
      ).status,
      409
    )
  })
  it('rejects malformed JSON without submitting a build', async () => {
    const { handlers, submitted } = setup()
    const malformed = new NextRequest(
      'https://cms.example.com/api/site-publish',
      {
        method: 'POST',
        body: '{',
        headers: {
          'content-type': 'application/json',
          'sec-fetch-site': 'same-origin',
        },
      }
    )
    assert.equal((await handlers.POST(malformed)).status, 400)
    assert.deepEqual(submitted, [])
  })
  it('maps Jenkins failures to 502 for status reads and submissions', async () => {
    const handlers = createSitePublishHandlers({
      authenticate: async () => true,
      loadPublishStatus: async () => {
        throw new Error('Jenkins unavailable')
      },
      triggerPublish: async () => {
        throw new Error('Jenkins unavailable')
      },
    })
    for (const response of [
      await handlers.GET(request({})),
      await handlers.POST(request({ environment: 'dev' })),
    ]) {
      assert.equal(response.status, 502)
      assert.deepEqual(await response.json(), { error: 'Jenkins unavailable' })
    }
  })
})
