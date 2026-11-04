import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import { __resetOctokitForTests, getOctokit } from '../client'
import { setGithubConfig } from '../config'
import { mergePullRequestToBase } from '../promotion'

const record = 'content/pages/en/home.json'
const upload = 'apps/web/public/cms/uploads/photo.png'
const input = {
  pullRequestNumber: 42,
  branchName: 'content/page-home-20261104-1111',
  commitSha: 'head',
}
const head = {
  ref: input.branchName,
  sha: 'head',
  repo: { full_name: 'logos-co/web' },
}
const user = { type: 'Bot', login: 'cms[bot]' }
const pr = {
  number: 42,
  state: 'open',
  draft: true,
  node_id: 'pr',
  html_url: 'https://github.com/logos-co/web/pull/42',
  base: { ref: 'develop', sha: 'base' },
  head,
  user,
}

function mockGithub({
  request = pr,
  files = [{ filename: record }, { filename: upload }],
  mode = '100644',
}: {
  request?: typeof pr
  files?: { filename: string; previous_filename?: string }[]
  mode?: string
} = {}) {
  const writes: string[] = []
  getOctokit().hook.wrap('request', async (_, options) => {
    let data: unknown
    switch (options.url) {
      case '/app':
        data = { slug: 'cms' }
        break
      case '/repos/{owner}/{repo}/pulls/{pull_number}':
        data = request
        break
      case '/repos/{owner}/{repo}/compare/{basehead}':
        assert.equal(options.basehead, 'base...head')
        data = { files }
        break
      case '/repos/{owner}/{repo}/git/trees/{tree_sha}':
        assert.equal(options.tree_sha, 'head')
        data = {
          truncated: false,
          tree: files.map((f) => ({ path: f.filename, mode })),
        }
        break
      case '/graphql':
        writes.push('ready')
        data = { data: {} }
        break
      case '/repos/{owner}/{repo}/pulls/{pull_number}/merge':
        assert.equal(options.sha, input.commitSha)
        writes.push('merge')
        data = { merged: true, sha: 'merged' }
        break
      default:
        assert.fail(`Unexpected GitHub call: ${options.url}`)
    }
    return { status: 200, headers: {}, url: options.url, data } as never
  })
  return writes
}

describe('CMS merge boundary', () => {
  beforeEach(() => {
    __resetOctokitForTests()
    setGithubConfig({
      owner: 'logos-co',
      repo: 'web',
      prBaseBranch: 'develop',
      contentBranchPrefix: 'content/',
      stagingBranch: 'develop',
      productionBranch: 'master',
      appId: '1',
      installationId: 1,
      appPrivateKey: 'unused',
      directCommitEnabled: false,
    })
  })

  it('marks the tracked draft ready and merges only the verified head', async () => {
    const writes = mockGithub()
    assert.equal((await mergePullRequestToBase(input)).merged, true)
    assert.deepEqual(writes, ['ready', 'merge'])
  })

  for (const [label, changes] of Object.entries({
    fork: { head: { ...head, repo: { full_name: 'outsider/web' } } },
    branch: { head: { ...head, ref: 'schema/work' } },
    author: { user: { type: 'User', login: 'editor' } },
    app: { user: { type: 'Bot', login: 'another[bot]' } },
    base: { base: { ref: 'master', sha: 'base' } },
    stale: { head: { ...head, sha: 'updated' } },
    closed: { state: 'closed' },
  })) {
    it(`rejects ${label} before mutating a draft`, async () => {
      const writes = mockGithub({ request: { ...pr, ...changes } })
      await assert.rejects(
        mergePullRequestToBase(input),
        /Only open content PRs|no longer matches/
      )
      assert.deepEqual(writes, [])
    })
  }

  for (const [label, options] of Object.entries({
    mixed: { files: [{ filename: record }, { filename: 'Jenkinsfile' }] },
    rename: {
      files: [
        { filename: record, previous_filename: '.github/workflows/test.yml' },
      ],
    },
    truncated: {
      files: Array.from({ length: 300 }, () => ({ filename: record })),
    },
    executableUpload: {
      files: [{ filename: 'apps/web/public/cms/uploads/page.html' }],
    },
    symlink: { mode: '120000' },
  })) {
    it(`rejects a ${label} diff before mutating a draft`, async () => {
      const writes = mockGithub(options)
      await assert.rejects(
        mergePullRequestToBase(input),
        /complete PR diff|regular files/
      )
      assert.deepEqual(writes, [])
    })
  }
})
