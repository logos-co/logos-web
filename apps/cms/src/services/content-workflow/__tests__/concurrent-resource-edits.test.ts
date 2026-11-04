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
  createResourceChangePullRequestHook,
  createDeletePullRequestHook,
  lockResourceBeforeDelete,
} from '../../../collections/content-pr-hooks'
import { startResourceTestCms } from '../../../collections/__tests__/resource-test-cms'
import { type ResourceDoc, resourceSaver } from '../resource-list'
import { createSaveAsPullRequest } from '../save-as-pr'
import { recordContentChangeRequest } from '../record-content-change'
import { withContentPathLock } from '../content-transaction'

const item = (slug: string): ResourceDoc => ({
  slug,
  title: slug,
  description: slug,
  href: '/media',
  ctaLabel: 'Open',
  status: 'published',
})

async function resourceGitFixture(
  t: TestContext,
  path: string,
  overlap = true
) {
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
  type Failure =
    | 'lookup'
    | 'second commit'
    | 'mirror'
    | 'applied without acknowledgement'
    | 'not applied without acknowledgement'
  let failure: Failure | undefined
  const save = createSaveAsPullRequest({
    recordContentChangeRequest: async (input) => {
      if (failure === 'mirror') {
        failure = undefined
        throw new Error('Mirror reconciliation failed')
      }
      return recordContentChangeRequest(input, async () => ({
        number: 1,
        branchName: branch,
        baseSha: base,
        headSha: git('rev-parse', branch),
        draft: true,
        nodeId: 'pr',
        htmlUrl: 'local',
      }))
    },
    getGithubConfig: () =>
      ({
        prBaseBranch: 'develop',
        contentBranchPrefix: 'content/',
      }) as never,
    withContentPathLock: async (p, req, file, operation, wait) => {
      if (++arrived === 2) release()
      if (overlap) await both
      return withContentPathLock(p, req, file, operation, wait)
    },
    listManagedPullRequests: async () => {
      if (failure === 'lookup') {
        failure = undefined
        throw new Error('GitHub unavailable')
      }
      return opened
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
        : []
    },
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
      if (failure === 'second commit' && expectedHeadSha !== base) {
        failure = undefined
        throw new Error('GitHub rejected the branch update')
      }
      if (failure === 'not applied without acknowledgement') {
        failure = undefined
        throw new Error('GitHub head unavailable')
      }
      assert.equal(git('rev-parse', branch), expectedHeadSha)
      for (const change of changes) {
        assert.ok('content' in change)
        await writeFile(join(repo, change.path), change.content)
      }
      git('add', '.')
      git('commit', '-qm', 'edit resource')
      if (failure === 'applied without acknowledgement') {
        failure = undefined
        throw new Error('GitHub head unavailable')
      }
      return { commitSha: git('rev-parse', branch) }
    },
  })
  return {
    save,
    failOnce: (at: Failure) => {
      failure = at
    },
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
  async function setup(
    t: TestContext,
    git: Awaited<ReturnType<typeof resourceGitFixture>>
  ) {
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
            createResourceChangePullRequestHook({
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
      ['a', 'b'].map((slug) => payload.create({ collection, data: item(slug) }))
    )
    const request = { collection, user, overrideAccess: false }
    return { payload, docs, request }
  }

  it(
    `preserves an accepted ${type} bulk edit if recording the PR head fails`,
    { skip: !process.env.CMS_TEST_DATABASE_URL, timeout: 30000 },
    async (t) => {
      const git = await resourceGitFixture(t, path, false)
      const { payload, docs, request } = await setup(t, git)
      git.failOnce('mirror')
      const id = docs[0]!.id
      const result = await payload.update({
        ...request,
        where: { id: { equals: id } },
        data: { slug: 'renamed' },
      })
      assert.equal(result.errors[0]?.id, id)
      assert.equal((await payload.findByID({ collection, id })).slug, 'renamed')
      assert.deepEqual(
        git.items().map((doc) => doc.slug),
        ['b', 'renamed', 'untouched']
      )
      assert.equal(git.prCount(), 1)
    }
  )
  it(
    `reserves both names and deletes the accepted ${type} slug after a single edit rolls back`,
    { skip: !process.env.CMS_TEST_DATABASE_URL, timeout: 30000 },
    async (t) => {
      const git = await resourceGitFixture(t, path, false)
      const { payload, docs, request } = await setup(t, git)
      const id = docs[0]!.id
      await payload.update({ ...request, id, data: { title: 'Seed PR' } })
      git.failOnce('applied without acknowledgement')
      await assert.rejects(
        payload.update({ ...request, id, data: { slug: 'renamed' } })
      )
      assert.equal((await payload.findByID({ collection, id })).slug, 'a')
      await assert.rejects(
        payload.update({
          ...request,
          id: docs[1]!.id,
          data: { slug: 'renamed' },
        }),
        { status: 409 }
      )
      assert.equal(
        (await payload.findByID({ collection, id: docs[1]!.id })).slug,
        'b'
      )
      await payload.delete({ ...request, id })
      assert.deepEqual(
        git.items().map((item) => item.slug),
        ['b', 'untouched']
      )
      assert.equal(
        (await payload.find({ collection: 'resource-renames' })).totalDocs,
        0
      )
    }
  )

  for (const fault of [
    'applied without acknowledgement',
    'not applied without acknowledgement',
    'mirror SQL timeout',
  ] as const) {
    it(
      `recovers ${type} on a title-only edit after ${fault}`,
      { skip: !process.env.CMS_TEST_DATABASE_URL, timeout: 30000 },
      async (t) => {
        const git = await resourceGitFixture(t, path, false)
        const { payload, docs, request } = await setup(t, git)
        const id = docs[0]!.id
        const args = { ...request, where: { id: { equals: id } } }
        const seed = await payload.update({
          ...args,
          data: { title: 'Before rename' },
        })
        assert.deepEqual(seed.errors, [])
        const locker = await payload.db.pool.connect()
        try {
          if (fault === 'mirror SQL timeout') {
            await locker.query('BEGIN')
            await locker.query(
              `SELECT id FROM "${payload.db.schemaName}".content_change_requests FOR UPDATE`
            )
          } else git.failOnce(fault)
          const failed = await payload.update({
            ...args,
            data: { slug: 'renamed', description: 'Changed with rename' },
          })
          assert.equal(failed.errors[0]?.id, id)
          if (fault === 'mirror SQL timeout')
            assert.match(failed.errors[0]!.message, /could not record its head/)
        } finally {
          if (fault === 'mirror SQL timeout') await locker.query('ROLLBACK')
          locker.release()
        }
        const slug =
          fault === 'not applied without acknowledgement' ? 'a' : 'renamed'
        const description = slug === 'a' ? 'a' : 'Changed with rename'
        assert.equal(
          (await payload.find({ collection: 'resource-renames' })).totalDocs,
          1
        )
        if (fault === 'mirror SQL timeout')
          assert.equal(
            (await payload.findByID({ collection, id })).slug,
            'renamed'
          )
        const next = await payload.update({
          ...args,
          data: { title: 'Follow-up' },
        })
        assert.deepEqual(next.errors, [])
        assert.equal(next.docs[0]?.slug, slug)
        const cms = await payload.findByID({ collection, id })
        assert.equal(cms.slug, slug)
        assert.equal(cms.description, description)
        assert.equal(cms.title, 'Follow-up')
        assert.deepEqual(
          git.items().map((item) => item.slug),
          [slug, 'b', 'untouched'].sort()
        )
        const saved = git.items().find((item) => item.slug === slug)
        assert.equal(saved?.description, description)
        assert.equal(saved?.title, cms.title)
        assert.equal(
          (await payload.find({ collection: 'resource-renames' })).totalDocs,
          0
        )
        assert.equal(git.prCount(), 1)
        assert.equal(
          (await payload.find({ collection: 'content-change-requests' }))
            .docs[0]?.commitSha,
          git.head()
        )
      }
    )
  }
  for (const scenario of [
    'partial failure',
    'second commit failed',
    'slug retry',
  ] as const) {
    it(
      `keeps CMS and PR JSON consistent after a ${type} bulk update: ${scenario}`,
      { skip: !process.env.CMS_TEST_DATABASE_URL, timeout: 30000 },
      async (t) => {
        const git = await resourceGitFixture(t, path, false)
        const { payload, docs, request } = await setup(t, git)
        git.failOnce(
          scenario === 'second commit failed' ? 'second commit' : 'lookup'
        )
        if (scenario !== 'slug retry') {
          const result = await payload.update({
            ...request,
            where: { id: { in: docs.map((doc) => doc.id) } },
            data: { title: 'Edited' },
          })
          assert.equal(result.errors.length, 1)
          assert.equal(result.docs.length, 1)
          const failed = docs.find((doc) => doc.id === result.errors[0]?.id)
          assert.ok(failed)
          const actual = await payload.findByID({ collection, id: failed.id })
          assert.deepEqual(actual, failed)
          const saved = result.docs[0]!
          assert.equal(saved.title, 'Edited')
          assert.deepEqual(
            git.items().map((x) => [x.slug, x.title]),
            ['a', 'b', 'untouched'].map((slug) => [
              slug,
              slug === saved.slug ? 'Edited' : slug,
            ])
          )
        } else {
          const original = docs[0]!
          const args = {
            ...request,
            where: { id: { equals: original.id } },
            data: { slug: 'renamed' },
          }
          const first = await payload.update(args)
          assert.equal(first.errors[0]?.id, original.id)
          assert.equal(git.prCount(), 0)
          assert.deepEqual(
            await payload.findByID({ collection, id: original.id }),
            original
          )
          const retried = await payload.update(args)
          assert.deepEqual(retried.errors, [])
          assert.equal(
            (await payload.findByID({ collection, id: original.id })).slug,
            'renamed'
          )
          assert.deepEqual(
            git.items().map((x) => x.slug),
            ['b', 'renamed', 'untouched']
          )
        }
        assert.equal(git.prCount(), 1)
        const mirror = await payload.find({
          collection: 'content-change-requests',
        })
        assert.equal(mirror.totalDocs, 1)
        assert.equal(mirror.docs[0]?.commitSha, git.head())
      }
    )
  }
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
        const { payload, docs, request } = await setup(t, git)
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
