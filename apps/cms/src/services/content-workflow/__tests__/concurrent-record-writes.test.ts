import assert from 'node:assert/strict'
import { it } from 'node:test'
import { drizzle } from '@payloadcms/db-postgres/drizzle/node-postgres'
import type { Payload, PayloadRequest } from 'payload'
import { Pool } from 'pg'
import { createSaveAsPullRequest } from '../save-as-pr'

it(
  'rejects an overlapping Idea update before opening a second PR for the pending deletion',
  { skip: !process.env.CMS_TEST_DATABASE_URL, timeout: 30000 },
  async () => {
    const pool = new Pool({
      connectionString: process.env.CMS_TEST_DATABASE_URL,
    })
    const db = drizzle(pool)
    const sessions: Record<string, { db: unknown }> = {}
    const payload = {
      db: { sessions },
      find: async () => ({ docs: [] }),
    } as unknown as Payload
    let entered!: () => void, release!: () => void
    const started = new Promise<void>((resolve) => {
      entered = resolve
    })
    const resume = new Promise<void>((resolve) => {
      release = resolve
    })
    let discoveries = 0,
      branches = 0
    const titles: string[] = []
    const save = createSaveAsPullRequest({
      getGithubConfig: () =>
        ({ contentBranchPrefix: 'content/', prBaseBranch: 'develop' }) as never,
      listManagedPullRequests: async () => {
        if (++discoveries === 1) {
          entered()
          await resume
        }
        return []
      },
      getBranchSha: async () => 'base',
      createBranchAtSha: async ({ sha }) => {
        branches++
        return { sha }
      },
      commitFiles: async () => ({ commitSha: 'saved' }),
      createOrGetPullRequest: async ({ title }) => {
        titles.push(title)
        return { number: 1, htmlUrl: 'local' } as never
      },
      recordContentChangeRequest: async () => 1,
    })
    const path = 'content/builders-hub/ideas/demo/index.json'
    const run = (action: 'delete' | 'update') =>
      db.transaction(async (tx) => {
        sessions[action] = { db: tx }
        return save({
          contentType: 'idea',
          payload,
          req: { payload, transactionID: action } as PayloadRequest,
          changes: [
            action === 'delete'
              ? { path, deleted: true }
              : { path, content: '{}' },
          ],
          prTitle: action,
          commitMessage: action,
        })
      })
    const deleting = run('delete')
    try {
      await Promise.race([started, deleting])
      await assert.rejects(
        run('update'),
        (error: unknown) =>
          error instanceof Error && 'status' in error && error.status === 409
      )
      release()
      await deleting
      assert.equal(discoveries, 1)
      assert.equal(branches, 1)
      assert.deepEqual(titles, ['delete'])
    } finally {
      release()
      try {
        await deleting
      } finally {
        await pool.end()
      }
    }
  }
)
