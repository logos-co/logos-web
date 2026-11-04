import assert from 'node:assert/strict'
import { it } from 'node:test'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import type { Payload } from 'payload'
import { recordContentChangeRequest } from '../record-content-change'
import { createRecentPrGetHandler } from '../../../app/(payload)/api/content-workflow/recent-pr/route'
import { NextRequest } from 'next/server'

it(
  'keeps the newest save visible when mirror writes finish in reverse order',
  { skip: !process.env.CMS_TEST_DATABASE_URL },
  async () => {
    const db = new Pool({ connectionString: process.env.CMS_TEST_DATABASE_URL })
    const schema = 'cms_test_' + randomUUID().replaceAll('-', '')

    try {
      await db.query(`CREATE SCHEMA "${schema}";
      CREATE TABLE "${schema}".content_change_requests (
        id serial PRIMARY KEY, branch_name text UNIQUE, content_type text, target_path text,
        pull_request_number numeric, pull_request_url text, commit_sha text, created_by_id integer,
        status text, updated_at timestamptz DEFAULT now()
      );`)
      const branchName = 'content/page-home-20261104-1111'
      const targetPath = 'content/pages/en/home.json'
      const payload = {
        db: { pool: db, schemaName: schema },
        auth: async () => ({ user: { id: 1 } }),
        find: async () => ({
          docs: (
            await db.query(`SELECT id, branch_name AS "branchName", content_type AS "contentType",
        target_path AS "targetPath", pull_request_number::int AS "pullRequestNumber", commit_sha AS "commitSha", status
        FROM "${schema}".content_change_requests`)
          ).rows,
        }),
      } as unknown as Payload
      const change = {
        payload,
        branchName,
        targetPath,
        contentType: 'page',
        pullRequestNumber: 42,
        pullRequestUrl: 'https://example.com/pr/42',
      }
      const live = {
        number: 42,
        branchName,
        headSha: 'B',
        baseSha: 'base',
        draft: true,
        htmlUrl: change.pullRequestUrl,
        nodeId: 'pr',
      }
      await recordContentChangeRequest({
        ...change,
        parentSha: 'base',
        commitSha: 'initial',
      })
      // GitHub accepted initial -> A -> B, but B reaches Postgres first.
      const id = await recordContentChangeRequest(
        { ...change, parentSha: 'A', commitSha: 'B' },
        async () => live
      )
      assert.equal(
        await recordContentChangeRequest(
          { ...change, parentSha: 'initial', commitSha: 'A' },
          async () => live
        ),
        id
      )
      const recent = createRecentPrGetHandler({
        getPayload: async () => payload,
        listManagedPullRequests: async () => [live],
        loadGithubConfigFromEnv: () => ({}) as never,
        setGithubConfig: () => undefined,
      })
      const response = await recent(
        new NextRequest(
          'http://localhost/api/content-workflow/recent-pr?collection=pages&slug=home'
        )
      )
      const { pullRequests } = await response.json()
      assert.deepEqual(
        pullRequests.map((pr: { headSha: string }) => pr.headSha),
        ['B']
      )
    } finally {
      try {
        await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      } finally {
        await db.end()
      }
    }
  }
)
