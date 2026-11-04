import assert from 'node:assert/strict'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'

import { buildContentBranchName, contentBranchStem } from '../branch-naming'
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
  withResourceListLock: async (_payload, _req, _path, save) =>
    save({} as never),
  compareContentFiles: async (pr) => ({
    mergeBaseSha: 'base',
    files: [
      {
        filename:
          pr.headSha === 'other-head'
            ? 'content/pages/en/other.json'
            : 'content/pages/en/home.json',
      },
    ] as never,
  }),
  readContentJson: async () => null,
  getFileBlobShas: async () => new Map(),
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
): Extract<SaveAsPullRequestInput, { changes: unknown }> => ({
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
          {
            ...managedPr,
            headSha: 'other-head',
            branchName: 'content/page-home-other-20261101-1111',
          },
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
          compareContentFiles: async () => ({
            mergeBaseSha: 'base',
            files: [{ filename: targetPath }] as never,
          }),
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

        changes: [{ path: targetPath, content: '{}' }],
      })
      assert.equal(result.pullRequestNumber, first.number)
    })
  }

  it('distinguishes Circle event-demo from Circle Event demo even when their legacy branch stems collide', async () => {
    const { payload } = createPayload()
    const circle = 'content/circles/circles/event-demo/index.json'
    const event = 'content/circles/events/demo/index.json'
    const legacy = {
      ...managedPr,
      branchName: 'content/circle-event-demo-20261101-1111',
    }
    const save = createSaveAsPullRequest(
      createDependencies({
        buildContentBranchName,
        listManagedPullRequests: async () => [legacy],
        compareContentFiles: async () => ({
          files: [{ filename: circle }] as never,
          mergeBaseSha: 'base',
        }),
        commitFiles: async ({ branch }) => {
          assert.notEqual(branch, legacy.branchName)
          return { commitSha: 'event' }
        },
      })
    )
    assert.equal(
      (
        await save({
          ...createInput(payload),
          contentType: 'circle-event',
          changes: [{ path: event, content: '{}' }],
        })
      ).pullRequestNumber,
      123
    )
    const a = 'content/builders-hub/rfps/' + 'a'.repeat(80)
    const now = new Date('2026-11-04')
    assert.notEqual(
      contentBranchStem({
        targetPath: a + '-a/index.json',
        contentType: 'rfp',
        now,
      }),
      contentBranchStem({
        targetPath: a + '-b/index.json',
        contentType: 'rfp',
        now,
      })
    )
  })

  it('reuses a legacy settings PR by its fixed file after the editor renames its slug', async () => {
    const { payload } = createPayload()
    const targetPath = 'content/site/en/settings.json'
    const save = createSaveAsPullRequest(
      createDependencies({
        buildContentBranchName,
        listManagedPullRequests: async () => [
          {
            ...managedPr,
            branchName: 'content/site-settings-old-slug-20261101-1111',
          },
        ],
        compareContentFiles: async () => ({
          mergeBaseSha: 'base',
          files: [{ filename: targetPath }] as never,
        }),
        verifyContentDiff: async () => [targetPath],
        createBranch: async () => assert.fail('must reuse the same PR'),
      })
    )
    assert.equal(
      (
        await save({
          ...createInput(payload),
          contentType: 'site-settings',
          changes: [{ path: targetPath, content: '{}' }],
        })
      ).pullRequestNumber,
      42
    )
  })

  it('recovers a missing mirror when removing old images, restoring only the PR changes', async () => {
    const { payload } = createPayload()
    const path = 'content/pages/en/home.json',
      added = 'apps/web/public/cms/uploads/new.webp',
      modified = 'apps/web/public/cms/uploads/existing.webp'
    const save = createSaveAsPullRequest(
      createDependencies({
        listManagedPullRequests: async () => [managedPr],
        verifyContentDiff: async () => [path, added, modified],
        readContentJson: async (file, ref) => {
          assert.equal(file, path)
          assert.equal(ref, managedPr.headSha)
          return {
            hero: '/cms/uploads/new.webp',
            aside: '/cms/uploads/existing.webp',
          }
        },
        getFileBlobShas: async (files, ref) => {
          assert.equal(ref, 'base')
          assert.deepEqual(files, [added, modified])
          return new Map([[modified, 'original-blob']])
        },
        commitFiles: async ({ changes }) => {
          assert.deepEqual(changes.slice(1), [
            { path: added, deleted: true },
            { path: modified, blobSha: 'original-blob' },
          ])
          return { commitSha: 'recovered' }
        },
      })
    )
    assert.equal((await save(createInput(payload))).pullRequestNumber, 42)
  })

  it('rejects a recovered PR carrying an upload not referenced by the saved record', async () => {
    const { payload } = createPayload()
    const save = createSaveAsPullRequest(
      createDependencies({
        listManagedPullRequests: async () => [managedPr],
        verifyContentDiff: async () => [
          'content/pages/en/home.json',
          'apps/web/public/cms/uploads/unrelated.svg',
        ],
        readContentJson: async () => ({}),
        commitFiles: async () => assert.fail('must not write'),
      })
    )
    await assert.rejects(save(createInput(payload)), /unrelated upload/)
  })

  it('includes referenced CMS uploads in the GitHub commit', async () => {
    await mkdir(join(publicRoot, 'cms/uploads'), { recursive: true })
    await writeFile(join(publicRoot, 'cms/uploads/hero.webp'), 'fake-image')
    const { payload } = createPayload()
    const save = createSaveAsPullRequest(createDependencies())

    const result = await save(createInput(payload, { withMedia: true }))

    assert.equal(result.commitSha, 'commit-with-media')
  })
})
