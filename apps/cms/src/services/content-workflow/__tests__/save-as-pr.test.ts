import assert from 'node:assert/strict'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'

import {
  __resetGithubConfigForTests,
  __resetOctokitForTests,
  getOctokit,
  mergePullRequestToBase,
  setGithubConfig,
  verifyContentDiff,
} from '@repo/content/github'

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
  withContentPathLock: async (_payload, _req, _path, save) => save({} as never),
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
  getBranchSha: async () => 'base-sha',
  createBranchAtSha: async () => ({ sha: 'base-sha' }),
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

  for (const headSha of ['commit-sha', 'unrelated']) {
    it(`checks the managed PR head after a lost creation response: ${headSha}`, async () => {
      const { payload } = createPayload()
      let created = false
      const save = createSaveAsPullRequest(
        createDependencies({
          buildContentBranchName: () => managedPr.branchName,
          listManagedPullRequests: async () =>
            created ? [{ ...managedPr, headSha }] : [],
          createOrGetPullRequest: async () => {
            created = true
            throw new Error('Response lost')
          },
        })
      )
      const saving = save(createInput(payload))
      if (headSha === 'commit-sha')
        assert.equal((await saving).pullRequestNumber, managedPr.number)
      else await assert.rejects(saving, /Response lost/)
    })
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
        createBranchAtSha: async () => assert.fail('must reuse branch'),
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
          createBranchAtSha: async () =>
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
        createBranchAtSha: async () => assert.fail('must reuse the same PR'),
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

  it('replaces SVGs in a tracked draft and lets the same PR merge', async () => {
    const targetPath = 'content/pages/en/home.json'
    const uploadDir = 'apps/web/public/cms/uploads'
    const addedSvg = `${uploadDir}/added.svg`
    const modifiedSvg = `${uploadDir}/modified.svg`
    const removedSvg = `${uploadDir}/removed.svg`
    const retainedImage = `${uploadDir}/other.webp`
    const newImage = `${uploadDir}/hero.webp`
    const diff = new Map([
      [targetPath, 'modified'],
      [addedSvg, 'added'],
      [modifiedSvg, 'modified'],
      [removedSvg, 'removed'],
      [retainedImage, 'added'],
    ])
    const compare = () =>
      [...diff].map(([filename, status]) => ({ filename, status }))
    const { payload } = createPayload([
      [
        {
          id: 1,
          targetPath,
          status: 'draft',
          branchName: managedPr.branchName,
          pullRequestNumber: managedPr.number,
          commitSha: managedPr.headSha,
        },
      ],
    ])
    await mkdir(join(publicRoot, 'cms/uploads'), { recursive: true })
    await writeFile(join(publicRoot, 'cms/uploads/hero.webp'), 'fake-image')

    let headSha = managedPr.headSha
    const dependencies = createDependencies({
      listManagedPullRequests: async () => [managedPr],
      compareContentFiles: async () => ({
        files: compare() as never,
        mergeBaseSha: 'base',
      }),
      verifyContentDiff,
      getFileBlobShas: async (files, ref) => {
        assert.equal(ref, 'base')
        assert.deepEqual(files, [addedSvg, modifiedSvg])
        return new Map([[modifiedSvg, 'base-svg-blob']])
      },
      createBranchAtSha: async () => assert.fail('must reuse the draft'),
      commitFiles: async ({ branch, changes, expectedHeadSha }) => {
        assert.equal(branch, managedPr.branchName)
        assert.equal(expectedHeadSha, headSha)
        assert.deepEqual(changes.slice(2), [
          { path: addedSvg, deleted: true },
          { path: modifiedSvg, blobSha: 'base-svg-blob' },
        ])
        for (const change of changes) {
          if ('deleted' in change) diff.delete(change.path)
          else if ('blobSha' in change) {
            assert.equal(change.blobSha, 'base-svg-blob')
            diff.delete(change.path)
          } else {
            diff.set(
              change.path,
              change.path === targetPath ? 'modified' : 'added'
            )
          }
        }
        headSha = 'replacement-head'
        return { commitSha: headSha }
      },
    })
    __resetOctokitForTests()
    setGithubConfig(dependencies.getGithubConfig())
    const writes: string[] = []
    getOctokit().hook.wrap('request', async (_, options) => {
      let data: unknown
      switch (options.url) {
        case '/app':
          data = { slug: 'cms' }
          break
        case '/repos/{owner}/{repo}/pulls/{pull_number}':
          data = {
            number: managedPr.number,
            state: 'open',
            draft: true,
            node_id: managedPr.nodeId,
            html_url: managedPr.htmlUrl,
            user: { type: 'Bot', login: 'cms[bot]' },
            base: { ref: 'develop', sha: managedPr.baseSha },
            head: {
              ref: managedPr.branchName,
              sha: headSha,
              repo: { full_name: 'logos-co/logos-co' },
            },
          }
          break
        case '/repos/{owner}/{repo}/compare/{basehead}':
          data = { files: compare(), merge_base_commit: { sha: 'base' } }
          break
        case '/repos/{owner}/{repo}/git/trees/{tree_sha}':
          assert.equal(options.tree_sha, headSha)
          data = {
            truncated: false,
            tree: compare()
              .filter(({ status }) => status !== 'removed')
              .map(({ filename }) => ({ path: filename, mode: '100644' })),
          }
          break
        case '/graphql':
          writes.push('ready')
          data = { data: {} }
          break
        case '/repos/{owner}/{repo}/pulls/{pull_number}/merge':
          assert.equal(options.pull_number, managedPr.number)
          assert.equal(options.sha, 'replacement-head')
          writes.push('merge')
          data = { merged: true, sha: 'merged' }
          break
        default:
          assert.fail(`Unexpected GitHub call: ${options.url}`)
      }
      return { status: 200, headers: {}, url: options.url, data } as never
    })
    try {
      const save = createSaveAsPullRequest(dependencies)
      const result = await save(createInput(payload, { withMedia: true }))
      assert.equal(result.pullRequestNumber, managedPr.number)
      assert.equal(diff.get(newImage), 'added')
      assert.equal(diff.get(retainedImage), 'added')
      assert.equal(diff.get(removedSvg), 'removed')
      const merge = await mergePullRequestToBase(result)
      assert.equal(merge.merged, true)
      assert.deepEqual(writes, ['ready', 'merge'])
    } finally {
      __resetOctokitForTests()
      __resetGithubConfigForTests()
    }
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

  it('reuses an image-only legacy PR with a matching open mirror and a verified image reference', async () => {
    const targetPath = 'content/pages/en/home.json'
    const image = 'apps/web/public/cms/uploads/hero.webp'
    const cached = {
      targetPath,
      status: 'open',
      branchName: managedPr.branchName,
      pullRequestNumber: managedPr.number,
      commitSha: managedPr.headSha,
    }
    const { payload } = createPayload([[cached]])
    const save = createSaveAsPullRequest(
      createDependencies({
        listManagedPullRequests: async () => [
          { ...managedPr, title: 'content(page): update home' },
        ],
        compareContentFiles: async () => ({
          files: [{ filename: image }] as never,
          mergeBaseSha: 'base',
        }),
        verifyContentDiff: async () => [image],
        readContentJson: async (path, ref) => {
          assert.equal(path, targetPath)
          assert.equal(ref, managedPr.headSha)
          return { hero: '/cms/uploads/hero.webp' }
        },
        createBranchAtSha: async () =>
          assert.fail('must reuse the verified legacy PR'),
      })
    )
    assert.equal((await save(createInput(payload))).pullRequestNumber, 42)
  })

  it('rejects unrelated images even with a matching legacy mirror', async () => {
    const { payload } = createPayload([
      [
        {
          targetPath: 'content/pages/en/home.json',
          status: 'open',
          branchName: managedPr.branchName,
          pullRequestNumber: 42,
          commitSha: managedPr.headSha,
        },
      ],
    ])
    const file = 'apps/web/public/cms/uploads/other.svg'
    const save = createSaveAsPullRequest(
      createDependencies({
        listManagedPullRequests: async () => [
          { ...managedPr, title: 'content(page): update home' },
        ],
        compareContentFiles: async () => ({
          files: [{ filename: file }] as never,
          mergeBaseSha: 'base',
        }),
        verifyContentDiff: async () => [file],
        readContentJson: async () => ({}),
        commitFiles: async () => assert.fail('must not write'),
      })
    )
    await assert.rejects(save(createInput(payload)), /unrelated upload/)
  })

  it('does not create a branch when a referenced image fails validation, including retries', async () => {
    const { payload } = createPayload()
    let branches = 0
    const save = createSaveAsPullRequest(
      createDependencies({
        createBranchAtSha: async () => {
          branches++
          return { sha: 'base-sha' }
        },
      })
    )
    for (let attempt = 0; attempt < 2; attempt++)
      await assert.rejects(
        save(createInput(payload, { withMedia: true })),
        /upload is missing/
      )
    assert.equal(branches, 0)
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
