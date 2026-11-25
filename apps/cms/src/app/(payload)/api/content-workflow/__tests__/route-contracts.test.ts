import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { NextRequest, NextResponse } from 'next/server'

import { createMergePrPostHandler } from '../merge-pr/route'
import { createRecentPrGetHandler } from '../recent-pr/route'
import { createSyncProductionHandlers } from '../sync-production/route'

const readJson = async (response: NextResponse) =>
  (await response.json()) as Record<string, unknown>

const request = (
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1]
) => new NextRequest(url, init)

const createPayload = ({ user = { id: 1 } }: { user?: unknown } = {}) =>
  ({
    auth: async () => ({ user }),
    find: async () => ({ docs: [] }),
  }) as never

describe('content workflow route contracts', () => {
  it('rejects invalid merge request bodies before loading GitHub config', async () => {
    const handler = createMergePrPostHandler({
      getPayload: async () => createPayload(),
      loadGithubConfigFromEnv: () => {
        throw new Error('should not load config')
      },
      mergeContentPullRequest: async () => {
        throw new Error('should not merge')
      },
      setGithubConfig: () => undefined,
    })

    const response = await handler(
      request('http://localhost/api/content-workflow/merge-pr', {
        headers: {
          'Sec-Fetch-Site': 'same-origin',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ headSha: 'a'.repeat(40), pullRequestNumber: 0 }),
        method: 'POST',
      })
    )

    assert.equal(response.status, 400)
    assert.match(String((await readJson(response)).error), /pullRequestNumber/)
  })

  it('rejects unauthenticated merge requests', async () => {
    const handler = createMergePrPostHandler({
      getPayload: async () => createPayload({ user: null }),
      loadGithubConfigFromEnv: () => ({ owner: 'logos-co' }) as never,
      mergeContentPullRequest: async () => {
        throw new Error('should not merge')
      },
      setGithubConfig: () => undefined,
    })

    const response = await handler(
      request('http://localhost/api/content-workflow/merge-pr', {
        headers: {
          'Sec-Fetch-Site': 'same-origin',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headSha: 'a'.repeat(40),
          pullRequestNumber: 123,
        }),
        method: 'POST',
      })
    )

    assert.equal(response.status, 401)
  })

  it('returns 422 when merge service fails', async () => {
    const handler = createMergePrPostHandler({
      getPayload: async () => createPayload(),
      loadGithubConfigFromEnv: () => ({ owner: 'logos-co' }) as never,
      mergeContentPullRequest: async () => {
        throw new Error('merge failed')
      },
      setGithubConfig: () => undefined,
    })

    const response = await handler(
      request('http://localhost/api/content-workflow/merge-pr', {
        headers: {
          'Sec-Fetch-Site': 'same-origin',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headSha: 'a'.repeat(40),
          pullRequestNumber: 123,
        }),
        method: 'POST',
      })
    )

    assert.equal(response.status, 422)
    assert.match(String((await readJson(response)).error), /merge failed/)
  })

  it('returns only matching CMS snapshots and takes the link from GitHub', async () => {
    const live = {
      number: 4,
      branchName: 'content/page-home-20261104-1111',
      baseSha: 'base',
      headSha: 'saved',
      nodeId: 'node',
      draft: true,
      htmlUrl: 'https://github.com/logos-co/logos-web/pull/4',
    }
    const row = {
      id: 1,
      contentType: 'page',
      targetPath: 'content/pages/en/home.json',
      branchName: live.branchName,
      commitSha: 'saved',
      pullRequestNumber: 4,
      pullRequestUrl: 'https://example.invalid/',
    }
    const handler = createRecentPrGetHandler({
      listManagedPullRequests: async () => [live],
      getPayload: async () =>
        ({
          auth: async () => ({ user: { id: 1 } }),
          find: async () => ({
            docs: [
              row,
              { ...row, commitSha: 'old' },
              { ...row, pullRequestNumber: 5 },
            ],
          }),
        }) as never,
      loadGithubConfigFromEnv: () => ({}) as never,
      setGithubConfig: () => undefined,
    })
    const response = await handler(
      request(
        'http://localhost/api/content-workflow/recent-pr?collection=pages&slug=home'
      )
    )
    const { pullRequests } = await response.json()
    assert.equal(pullRequests.length, 1)
    assert.equal(pullRequests[0].pullRequestUrl, live.htmlUrl)
    assert.equal(pullRequests[0].headSha, live.headSha)
  })

  it('rejects unauthenticated recent PR lookups', async () => {
    const handler = createRecentPrGetHandler({
      listManagedPullRequests: async () => [],
      getPayload: async () => createPayload({ user: null }),
      loadGithubConfigFromEnv: () => ({ owner: 'logos-co' }) as never,
      setGithubConfig: () => undefined,
    })

    const response = await handler(
      request(
        'http://localhost/api/content-workflow/recent-pr?collection=pages'
      )
    )

    assert.equal(response.status, 401)
  })

  it('rejects unsupported recent PR collections', async () => {
    const handler = createRecentPrGetHandler({
      listManagedPullRequests: async () => [],
      getPayload: async () => createPayload(),
      loadGithubConfigFromEnv: () => ({ owner: 'logos-co' }) as never,
      setGithubConfig: () => undefined,
    })

    const response = await handler(
      request(
        'http://localhost/api/content-workflow/recent-pr?collection=unknown'
      )
    )

    assert.equal(response.status, 400)
  })

  it('returns 500 when recent PR GitHub config cannot load', async () => {
    const handler = createRecentPrGetHandler({
      listManagedPullRequests: async () => [],
      getPayload: async () => createPayload(),
      loadGithubConfigFromEnv: () => {
        throw new Error('missing github env')
      },
      setGithubConfig: () => undefined,
    })

    const response = await handler(
      request(
        'http://localhost/api/content-workflow/recent-pr?collection=pages&slug=home'
      )
    )

    assert.equal(response.status, 500)
    assert.match(
      String((await readJson(response)).error),
      /GitHub PR lookup failed/
    )
  })

  it('rejects unauthenticated sync-production requests', async () => {
    const { GET } = createSyncProductionHandlers({
      compareProductionToStaging: async () => ({}) as never,
      getBranchSyncDecision: () => ({ kind: 'already-synced', sha: 'sha' }),
      getBranchSyncLinks: () => ({
        compareUrl: '',
        productionBranchUrl: '',
        stagingBranchUrl: '',
      }),
      getPayload: async () => createPayload({ user: null }),
      loadGithubConfigFromEnv: () => ({ owner: 'logos-co' }) as never,
      recordPromotion: async () => undefined,
      setGithubConfig: () => undefined,
      syncProductionToStaging: async () => ({}) as never,
    })

    const response = await GET(
      request('http://localhost/api/content-workflow/sync-production')
    )

    assert.equal(response.status, 401)
  })

  it('returns 500 when sync-production GitHub config cannot load', async () => {
    const { GET } = createSyncProductionHandlers({
      compareProductionToStaging: async () => ({}) as never,
      getBranchSyncDecision: () => ({ kind: 'already-synced', sha: 'sha' }),
      getBranchSyncLinks: () => ({
        compareUrl: '',
        productionBranchUrl: '',
        stagingBranchUrl: '',
      }),
      getPayload: async () => createPayload(),
      loadGithubConfigFromEnv: () => {
        throw new Error('missing github env')
      },
      recordPromotion: async () => undefined,
      setGithubConfig: () => undefined,
      syncProductionToStaging: async () => ({}) as never,
    })

    const response = await GET(
      request('http://localhost/api/content-workflow/sync-production')
    )

    assert.equal(response.status, 500)
  })

  it('hides raw GitHub errors from a failed merge', async () => {
    const handler = createMergePrPostHandler({
      getPayload: async () => createPayload(),
      loadGithubConfigFromEnv: () => ({ owner: 'logos-co' }) as never,
      mergeContentPullRequest: async () => {
        throw Object.assign(
          new Error('Resource not accessible by integration'),
          {
            status: 403,
          }
        )
      },
      setGithubConfig: () => undefined,
    })
    const originalError = console.error
    console.error = () => undefined
    try {
      const response = await handler(
        request('http://localhost/api/content-workflow/merge-pr', {
          headers: {
            'Sec-Fetch-Site': 'same-origin',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            headSha: 'a'.repeat(40),
            pullRequestNumber: 123,
          }),
          method: 'POST',
        })
      )
      assert.equal(response.status, 422)
      assert.doesNotMatch(
        String((await readJson(response)).error),
        /integration/
      )
    } finally {
      console.error = originalError
    }
  })

  it('passes the signed-in user to the merge service', async () => {
    const users: unknown[] = []
    const handler = createMergePrPostHandler({
      getPayload: async () => createPayload({ user: { id: 9 } }),
      loadGithubConfigFromEnv: () => ({ owner: 'logos-co' }) as never,
      mergeContentPullRequest: async ({ user }) => {
        users.push(user)
        return {} as never
      },
      setGithubConfig: () => undefined,
    })
    await handler(
      request('http://localhost/api/content-workflow/merge-pr', {
        headers: {
          'Sec-Fetch-Site': 'same-origin',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headSha: 'a'.repeat(40),
          pullRequestNumber: 123,
        }),
        method: 'POST',
      })
    )
    assert.deepEqual(users, [{ id: 9 }])
  })

  const syncHandlers = (
    overrides: Partial<Parameters<typeof createSyncProductionHandlers>[0]> = {}
  ) =>
    createSyncProductionHandlers({
      compareProductionToStaging: async () => ({}) as never,
      getBranchSyncDecision: () => ({ kind: 'already-synced', sha: 'sha' }),
      getBranchSyncLinks: () => ({
        compareUrl: '',
        productionBranchUrl: '',
        stagingBranchUrl: '',
      }),
      getPayload: async () => createPayload(),
      loadGithubConfigFromEnv: () => ({ owner: 'logos-co' }) as never,
      recordPromotion: async () => undefined,
      setGithubConfig: () => undefined,
      syncProductionToStaging: async () => assert.fail('must not sync'),
      ...overrides,
    })

  const syncPost = (headers: Record<string, string>) =>
    request('http://localhost/api/content-workflow/sync-production', {
      headers,
      body: '{}',
      method: 'POST',
    })

  it('requires a same-origin JSON request to promote', async () => {
    const { POST } = syncHandlers()
    for (const headers of <Record<string, string>[]>[
      { 'Content-Type': 'application/json' },
      { 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'text/plain' },
    ]) {
      assert.equal((await POST(syncPost(headers))).status, 403)
    }
  })

  it('records who promoted a fast-forward', async () => {
    const promoted: unknown[] = []
    const { POST } = syncHandlers({
      getPayload: async () => createPayload({ user: { id: 4 } }),
      recordPromotion: async ({ userId }) => {
        promoted.push(userId)
      },
      syncProductionToStaging: async () =>
        ({
          decision: { kind: 'fast-forward', sha: 'sha' },
          promotion: { kind: 'fast-forward' },
          updated: true,
        }) as never,
    })
    const response = await POST(
      syncPost({
        'Sec-Fetch-Site': 'same-origin',
        'Content-Type': 'application/json',
      })
    )
    assert.equal(response.status, 200)
    assert.deepEqual(promoted, [4])
  })

  it('explains a release PR opened because promotion is not enabled', async () => {
    const { POST } = syncHandlers({
      recordPromotion: async () => assert.fail('nothing was promoted'),
      syncProductionToStaging: async () =>
        ({
          decision: { kind: 'fast-forward', sha: 'sha' },
          promotion: {
            kind: 'release-pr',
            reason: 'fast-forward-refused',
            pullRequestNumber: 7,
            pullRequestUrl: 'https://github.com/pr/7',
          },
          updated: false,
        }) as never,
    })
    const body = await readJson(
      await POST(
        syncPost({
          'Sec-Fetch-Site': 'same-origin',
          'Content-Type': 'application/json',
        })
      )
    )
    assert.match(
      String(body.message),
      /ask an admin to enable content promotion/i
    )
  })

  it('hides raw GitHub errors from a failed promotion', async () => {
    const { POST } = syncHandlers({
      syncProductionToStaging: async () => {
        throw Object.assign(new Error('Bad credentials'), { status: 401 })
      },
    })
    const originalError = console.error
    console.error = () => undefined
    try {
      const response = await POST(
        syncPost({
          'Sec-Fetch-Site': 'same-origin',
          'Content-Type': 'application/json',
        })
      )
      assert.equal(response.status, 502)
      assert.doesNotMatch(
        String((await readJson(response)).error),
        /credentials/
      )
    } finally {
      console.error = originalError
    }
  })
})
