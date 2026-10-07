import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createGithubPublishClient,
  type GithubPublishApi,
  type GithubWorkflowRun,
} from '../github'
import { DispatchUncertainError } from '../dispatch-error'

const workflowRun = (
  overrides: Partial<GithubWorkflowRun> = {}
): GithubWorkflowRun => ({
  id: 42,
  display_title: 'Site publish: dev',
  html_url: 'https://github.com/example/site/actions/runs/42',
  event: 'repository_dispatch',
  head_branch: 'develop',
  status: 'completed',
  conclusion: 'success',
  created_at: '2026-10-07T10:00:00Z',
  run_started_at: '2026-10-07T10:00:01Z',
  updated_at: '2026-10-07T10:06:00Z',
  ...overrides,
})
const api = (overrides: Partial<GithubPublishApi> = {}): GithubPublishApi => ({
  listRuns: async () => [workflowRun()],
  listArtifacts: async () => [{ name: 'press-snapshot', expired: false }],
  dispatch: async () => {},
  ...overrides,
})

describe('GitHub App site publishing', () => {
  it('keeps staging and live runs separate and excludes untrusted refs and events', async () => {
    const client = createGithubPublishClient(
      api({
        listRuns: async () => [
          workflowRun({ id: 45, display_title: 'Site publish: production' }),
          workflowRun({ id: 44, head_branch: 'feature/unreviewed' }),
          workflowRun({ id: 43, event: 'pull_request' }),
          workflowRun(),
        ],
      }),
      'develop'
    )
    assert.deepEqual(
      (await client.listRuns('dev')).map((run) => run.id),
      [42]
    )
    assert.deepEqual(
      (await client.listRuns('production')).map((run) => run.id),
      [45]
    )
    assert.equal((await client.listRuns('dev'))[0]?.hasSnapshot, true)
  })
  it('maps queued, running and failed workflow runs without promoting them', async () => {
    for (const [status, conclusion, state] of [
      ['queued', null, 'queued'],
      ['in_progress', null, 'running'],
      ['completed', 'failure', 'finished'],
    ] as const) {
      const client = createGithubPublishClient(
        api({
          listRuns: async () => [workflowRun({ status, conclusion })],
          listArtifacts: async () =>
            assert.fail('must not read an unsuccessful snapshot'),
        }),
        'develop'
      )
      const run = (await client.listRuns('dev'))[0]!
      assert.equal(run.state, state)
      assert.equal(run.succeeded, false)
      assert.equal(run.hasSnapshot, false)
    }
  })
  it('rejects missing, expired and deleted snapshots', async () => {
    for (const artifacts of [
      [],
      [{ name: 'other', expired: false }],
      [{ name: 'press-snapshot', expired: true }],
      [
        {
          name: 'press-snapshot',
          expired: false,
          expires_at: '2000-01-01T00:00:00Z',
        },
      ],
    ]) {
      const client = createGithubPublishClient(
        api({ listArtifacts: async () => artifacts }),
        'develop'
      )
      assert.equal((await client.listRuns('dev'))[0]?.hasSnapshot, false)
    }
  })
  it('dispatches reviewed live media and omits preview IDs on staging requests', async () => {
    const submitted: unknown[] = []
    const client = createGithubPublishClient(
      api({
        dispatch: async (payload) => {
          submitted.push(payload)
        },
      }),
      'develop'
    )
    await client.dispatch('dev', 999)
    await client.dispatch('production', 42)
    assert.deepEqual(submitted, [
      { environment: 'dev' },
      { environment: 'production', previewBuild: 42 },
    ])
  })
  it('retains uncertain network and server failures but releases confirmed rejections', async () => {
    for (const error of [new Error('timeout'), { status: 503 }]) {
      const client = createGithubPublishClient(
        api({
          dispatch: async () => {
            throw error
          },
        }),
        'develop'
      )
      await assert.rejects(() => client.dispatch('dev'), DispatchUncertainError)
    }
    const rejected = { status: 403 }
    const client = createGithubPublishClient(
      api({
        dispatch: async () => {
          throw rejected
        },
      }),
      'develop'
    )
    await assert.rejects(
      () => client.dispatch('dev'),
      (error) => error === rejected
    )
  })
})
