import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { it } from 'node:test'
import { drizzle } from '@payloadcms/db-postgres/drizzle/node-postgres'
import type { Payload, PayloadRequest } from 'payload'
import { Pool } from 'pg'
import { type ResourceDoc, resourceSaver } from '../resource-list'
import { createSaveAsPullRequest } from '../save-as-pr'
import { withContentPathLock } from '../content-transaction'

for (const [type, path] of [
  ['builder-resource', 'content/builders-hub/resources/en.json'],
  ['circle-resource', 'content/circles/resources/en.json'],
] as const) {
  it(
    `keeps both concurrent ${type} edits in the final Git PR JSON`,
    { skip: !process.env.CMS_TEST_DATABASE_URL, timeout: 30000 },
    async () => {
      const repo = await mkdtemp(join(tmpdir(), 'resource-pr-'))
      const pool = new Pool({
        connectionString: process.env.CMS_TEST_DATABASE_URL,
      })
      const db = drizzle(pool)
      const git = (...args: string[]) =>
        execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
      const item = (slug: string): ResourceDoc => ({
        slug,
        title: slug,
        description: slug,
        href: '/media',
        ctaLabel: 'Open',
        status: 'published',
      })
      try {
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
        const sessions: Record<string, { db: unknown }> = {}
        const payload = {
          db: { sessions },
          find: async () => ({ docs: [] }),
        } as unknown as Payload
        // GitHub transport is local. Each save gets a real, independent Postgres transaction.
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
          recordContentChangeRequest: async () => 1,
        })
        const edit = resourceSaver(type, 'upsert', save)
        const run = (slug: string) =>
          db.transaction(async (tx) => {
            sessions[slug] = { db: tx }
            return edit({
              doc: { ...item(slug), title: `edited ${slug}` },
              payload,
              req: { transactionID: slug, payload } as PayloadRequest,
            })
          })
        const saves = await Promise.all([run('a'), run('b')])
        assert.deepEqual(
          saves.map((s) => s.pullRequestNumber),
          [1, 1]
        )
        assert.equal(opened, 1)
        assert.equal(git('rev-list', '--count', `${base}..${branch}`), '2')
        assert.deepEqual(
          JSON.parse(git('show', `${branch}:${path}`)).items.map(
            (x: ResourceDoc) => x.title
          ),
          ['edited a', 'edited b', 'untouched']
        )
      } finally {
        await pool.end()
        await rm(repo, { recursive: true, force: true })
      }
    }
  )
}
