import assert from 'node:assert/strict'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'

import { buildContentBranchName } from '../branch-naming'
import {
  createSaveAsPullRequest,
  type SaveAsPullRequestDependencies,
  type SaveAsPullRequestInput,
} from '../save-as-pr'

const publicRoot = join(process.cwd(), 'tmp-save-as-pr-public')

type PayloadCall = {
  collection: string
  data?: Record<string, unknown>
  id?: string | number
  where?: unknown
}

const createPayload = (findResults: unknown[][] = [[]]) => {
  const calls: {
    create: PayloadCall[]
    find: PayloadCall[]
    update: PayloadCall[]
  } = {
    create: [],
    find: [],
    update: [],
  }

  return {
    calls,
    payload: {
      find: async (input: PayloadCall) => {
        const docs =
          findResults[Math.min(calls.find.length, findResults.length - 1)] ?? []
        calls.find.push(input)
        return { docs }
      },
      create: async (input: PayloadCall) => {
        calls.create.push(input)
        return { id: 'ccr-created', ...(input.data ?? {}) }
      },
      update: async (input: PayloadCall) => {
        calls.update.push(input)
        return { id: input.id, ...(input.data ?? {}) }
      },
    },
  }
}

const createDependencies = (
  overrides: Partial<SaveAsPullRequestDependencies> = {}
): SaveAsPullRequestDependencies => ({
  recordContentChangeRequest: async () => 1,
  buildContentBranchName: () => 'content/page-home-20261104-1111',
  collectReferencedCmsUploadChanges: async ({ changes }) => {
    const { collectReferencedCmsUploadChanges } =
      await import('../media-file-changes')
    return collectReferencedCmsUploadChanges({ changes, publicRoot })
  },
  commitFiles: async ({ changes }) => ({
    commitSha: changes.some(
      (change) => change.path === 'apps/web/public/cms/uploads/hero.webp'
    )
      ? 'commit-with-media'
      : 'commit-sha',
  }),
  createBranch: async () => ({ sha: 'base-sha' }),
  createOrGetPullRequest: async ({ branchName }) => ({
    baseBranch: 'develop',
    branchName,
    changedFiles: 1,
    draft: true,
    htmlUrl: `https://github.com/logos-co/logos-co/pull/123`,
    merged: false,
    nodeId: 'node-123',
    number: 123,
    state: 'open',
    title: 'content(page): update home',
  }),
  listManagedPullRequests: async () => [],
  verifyContentDiff: async () => ['content/pages/en/home.json'],
  getGithubConfig: () => ({
    appId: 'app',
    appPrivateKey: 'private-key',
    contentBranchPrefix: 'content/',
    directCommitEnabled: false,
    installationId: 1,
    owner: 'logos-co',
    prBaseBranch: 'develop',
    productionBranch: 'master',
    repo: 'logos-co',
    stagingBranch: 'develop',
  }),
  ...overrides,
})

const createInput = (
  payload: unknown,
  { withMedia = false }: { withMedia?: boolean } = {}
): SaveAsPullRequestInput => ({
  changes: [
    {
      path: 'content/pages/en/home.json',
      content: JSON.stringify({
        hero: withMedia
          ? { image: '/cms/uploads/hero.webp' }
          : { title: 'Home' },
      }),
    },
  ],
  commitMessage: 'content(page): update home',
  contentType: 'page',
  draft: true,
  identifier: 'home',
  payload: payload as SaveAsPullRequestInput['payload'],
  prTitle: 'content(page): update home',
})

afterEach(async () => {
  await rm(publicRoot, { recursive: true, force: true })
})

describe('createSaveAsPullRequest', () => {
  it('throws when there are no file changes', async () => {
    const { payload } = createPayload()
    const save = createSaveAsPullRequest(createDependencies())

    await assert.rejects(
      save({ ...createInput(payload), changes: [] }),
      /requires at least one file change/
    )
  })

  const managedPr = {
    branchName: 'content/page-home-20261101-1111',
    headSha: 'live-sha',
    baseSha: 'base-sha',
    draft: true,
    htmlUrl: 'https://github.com/logos-co/logos-web/pull/42',
    nodeId: 'node-42',
    number: 42,
  }

  it('ignores a forged mirror branch and incomplete metadata when choosing the commit target', async () => {
    const { payload } = createPayload([
      [{ id: 'old', branchName: 'schema/code' }],
    ])
    const save = createSaveAsPullRequest(
      createDependencies({
        commitFiles: async ({ branch, expectedHeadSha }) => {
          assert.equal(branch, 'content/page-home-20261104-1111')
          assert.equal(expectedHeadSha, 'base-sha')
          return { commitSha: 'new' }
        },
      })
    )
    await save(createInput(payload))
  })

  it('recovers a managed PR by record and commits on the verified parent', async () => {
    const { payload } = createPayload()
    const save = createSaveAsPullRequest(
      createDependencies({
        listManagedPullRequests: async () => [
          managedPr,
          { ...managedPr, branchName: 'content/page-home-other-20261101-1111' },
        ],
        createBranch: async () => assert.fail('must reuse branch'),
        commitFiles: async ({ branch, expectedHeadSha }) => {
          assert.equal(branch, managedPr.branchName)
          assert.equal(expectedHeadSha, managedPr.headSha)
          return { commitSha: 'new' }
        },
      })
    )
    assert.equal((await save(createInput(payload))).pullRequestNumber, 42)
  })

  it('rejects a matching branch containing a different record before writing', async () => {
    const { payload } = createPayload()
    const save = createSaveAsPullRequest(
      createDependencies({
        listManagedPullRequests: async () => [managedPr],
        verifyContentDiff: async () => ['content/pages/en/other.json'],
        commitFiles: async () => assert.fail('must not write'),
      })
    )
    await assert.rejects(save(createInput(payload)), /different record/)
  })

  it('rejects multiple managed PRs for the same record', async () => {
    const { payload } = createPayload()
    const save = createSaveAsPullRequest(
      createDependencies({
        listManagedPullRequests: async () => [
          managedPr,
          { ...managedPr, number: 43 },
        ],
      })
    )
    await assert.rejects(
      save(createInput(payload)),
      /multiple open pull requests/
    )
  })

  for (const [contentType, targetPath] of [
    ['builder-resource', 'content/builders-hub/resources/en.json'],
    ['circle-resource', 'content/circles/resources/en.json'],
  ] as const) {
    it(`reuses the same file PR for different ${contentType} slugs, including pre-existing branches`, async () => {
      const { payload } = createPayload()
      const first = {
        ...managedPr,
        branchName: `content/${contentType}-first-20261101-1111`,
      }
      const save = createSaveAsPullRequest(
        createDependencies({
          buildContentBranchName,
          listManagedPullRequests: async () => [first],
          verifyContentDiff: async () => [targetPath],
          createBranch: async () =>
            assert.fail('must reuse the first resource PR'),
          commitFiles: async ({ branch, expectedHeadSha }) => {
            assert.equal(branch, first.branchName)
            assert.equal(expectedHeadSha, first.headSha)
            return { commitSha: 'second' }
          },
        })
      )
      const result = await save({
        ...createInput(payload),
        contentType,
        identifier: 'second',
        changes: [{ path: targetPath, content: '{}' }],
      })
      assert.equal(result.pullRequestNumber, first.number)
    })
  }

  it('includes referenced CMS uploads in the GitHub commit', async () => {
    await mkdir(join(publicRoot, 'cms/uploads'), { recursive: true })
    await writeFile(join(publicRoot, 'cms/uploads/hero.webp'), 'fake-image')
    const { payload } = createPayload()
    const save = createSaveAsPullRequest(createDependencies())

    const result = await save(createInput(payload, { withMedia: true }))

    assert.equal(result.commitSha, 'commit-with-media')
  })
})
