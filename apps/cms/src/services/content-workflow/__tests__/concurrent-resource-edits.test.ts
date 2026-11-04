import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { it, type TestContext } from 'node:test'
import { BuilderResources } from '../../../collections/BuilderResources'
import { CircleResources } from '../../../collections/Circles'
import { ContentChangeRequests } from '../../../collections/ContentChangeRequests'
import { Users } from '../../../collections/Users'
import {
  createChangePullRequestHook,
  createDeletePullRequestHook,
  lockResourceBeforeDelete,
} from '../../../collections/content-pr-hooks'
import { startResourceTestCms } from '../../../collections/__tests__/resource-test-cms'
import { type ResourceDoc, resourceSaver } from '../resource-list'
import { createSaveAsPullRequest } from '../save-as-pr'
import { withContentPathLock } from '../content-transaction'

const item = (slug: string): ResourceDoc => ({
  slug,
  title: slug,
  description: slug,
  href: '/media',
  ctaLabel: 'Open',
  status: 'published',
})

async function resourceGitFixture(t: TestContext, path: string) {
  const repo = await mkdtemp(join(tmpdir(), 'resource-pr-'))
  t.after(() => rm(repo, { recursive: true, force: true }))
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', repo, ...args], {
      encoding: 'utf8',
    }).trim()
  git('init', '-q', '-b', 'develop')
  git('config', 'user.name', 'Test')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'commit.gpgsign', 'false')
  await mkdir(join(repo, dirname(path)), { recursive: true })
  await writeFile(
    join(repo, path),
    JSON.stringify({
      schemaVersion: 1,
      language: 'en',
      items: ['a', 'b', 'untouched'].map(item),
    })
  )
  git('add', '.')
  git('commit', '-qm', 'initial')
  const base = git('rev-parse', 'HEAD')
  let branch = '',
    opened = 0,
    arrived = 0
  let release!: () => void
  const both = new Promise<void>((resolve) => {
    release = resolve
  })
  const save = createSaveAsPullRequest({
    getGithubConfig: () =>
      ({
        prBaseBranch: 'develop',
        contentBranchPrefix: 'content/',
      }) as never,
    withContentPathLock: async (p, req, file, operation, wait) => {
      if (++arrived === 2) release()
      await both
      return withContentPathLock(p, req, file, operation, wait)
    },
    listManagedPullRequests: async () =>
      opened
        ? [
            {
              number: 1,
              branchName: branch,
              baseSha: base,
              headSha: git('rev-parse', branch),
              draft: true,
              nodeId: 'pr',
              htmlUrl: 'local',
            },
          ]
        : [],
    compareContentFiles: async (pr) => ({
      mergeBaseSha: base,
      files: git('diff', '--name-only', base, pr.headSha)
        .split('\n')
        .map((filename) => ({ filename })) as never,
    }),
    verifyContentDiff: async (pr) =>
      git('diff', '--name-only', base, pr.headSha).split('\n'),
    readContentJson: async (file, ref) =>
      JSON.parse(git('show', `${ref}:${file}`)),
    getBranchSha: async () => base,
    createBranchAtSha: async ({ newBranch }) => {
      assert.equal(branch, '')
      branch = newBranch
      git('checkout', '-qb', branch)
      return { sha: base }
    },
    createOrGetPullRequest: async () => {
      opened++
      return { number: 1, htmlUrl: 'local' } as never
    },
    commitFiles: async ({ expectedHeadSha, changes }) => {
      assert.equal(git('rev-parse', branch), expectedHeadSha)
      for (const change of changes) {
        assert.ok('content' in change)
        await writeFile(join(repo, change.path), change.content)
      }
      git('add', '.')
      git('commit', '-qm', 'edit resource')
      return { commitSha: git('rev-parse', branch) }
    },
  })
  return {
    save,
    head: () => git('rev-parse', branch),
    commitCount: () => Number(git('rev-list', '--count', `${base}..${branch}`)),
    prCount: () => opened,
    items: (): ResourceDoc[] =>
      JSON.parse(git('show', `${branch}:${path}`)).items,
  }
}

for (const [type, collection, config, path] of [
  [
    'builder-resource',
    'builder-resources',
    BuilderResources,
    'content/builders-hub/resources/en.json',
  ],
  [
    'circle-resource',
    'circle-resources',
    CircleResources,
    'content/circles/resources/en.json',
  ],
] as const) {
  for (const operation of [
    'concurrent edits',
    'bulk update',
    'bulk delete',
  ] as const) {
    it(
      `keeps both ${type} changes in the final Git PR JSON for ${operation}`,
      { skip: !process.env.CMS_TEST_DATABASE_URL, timeout: 30000 },
      async (t) => {
        const git = await resourceGitFixture(t, path)
        // Each case uses a fresh schema with the same tables as the previous case.
        process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
        const payload = await startResourceTestCms(t, [
          Users,
          ContentChangeRequests,
          {
            ...config,
            lockDocuments: false,
            hooks: {
              ...config.hooks,
              afterChange: [
                createChangePullRequestHook({
                  save: resourceSaver(type, 'upsert', git.save),
                }),
              ],
              beforeDelete: [
                lockResourceBeforeDelete,
                createDeletePullRequestHook({
                  collection,
                  save: resourceSaver(type, 'delete', git.save),
                }),
              ],
            },
          },
        ])
        const user = await payload.create({
          collection: 'users',
          data: {
            email: 'editor@example.invalid',
            password: 'resource-test-password',
          },
        })
        const docs = await Promise.all(
          ['a', 'b'].map((slug) =>
            payload.create({ collection, data: item(slug) })
          )
        )
        const request = { collection, user, overrideAccess: false }
        if (operation === 'concurrent edits') {
          await Promise.all(
            docs.map((doc) =>
              payload.update({
                ...request,
                id: doc.id,
                data: { title: `edited ${doc.slug}` },
              })
            )
          )
        } else {
          const where = { id: { in: docs.map((doc) => doc.id) } }
          const result =
            operation === 'bulk update'
              ? await payload.update({
                  ...request,
                  where,
                  data: { title: 'Bulk edited' },
                })
              : await payload.delete({ ...request, where })
          assert.deepEqual(result.errors, [])
          assert.equal(result.docs.length, 2)
        }
        const mirror = await payload.find({
          collection: 'content-change-requests',
        })
        assert.equal(mirror.totalDocs, 1)
        assert.equal(mirror.docs[0]?.commitSha, git.head())
        assert.equal(git.prCount(), 1)
        assert.equal(git.commitCount(), 2)
        assert.deepEqual(
          git.items().map((x) => [x.slug, x.title]),
          {
            'concurrent edits': [
              ['a', 'edited a'],
              ['b', 'edited b'],
              ['untouched', 'untouched'],
            ],
            'bulk update': [
              ['a', 'Bulk edited'],
              ['b', 'Bulk edited'],
              ['untouched', 'untouched'],
            ],
            'bulk delete': [['untouched', 'untouched']],
          }[operation]
        )
      }
    )
  }
}
