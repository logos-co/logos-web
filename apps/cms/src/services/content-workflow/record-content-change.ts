import { getManagedPullRequest } from '@repo/content/github'
import type { Payload, PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import { resourceRecoveryDb } from './resource-recovery'

interface SavedContentChange {
  independent?: boolean
  req?: PayloadRequest
  payload: Payload
  contentType: string
  targetPath: string
  branchName: string
  pullRequestNumber: number
  pullRequestUrl: string
  commitSha: string
  parentSha: string
  editor?: { payloadUserId?: string | number }
}

export async function recordContentChangeRequest(
  input: SavedContentChange,
  readPr = getManagedPullRequest
): Promise<number> {
  const adapter = input.payload.db
  const id = await input.req?.transactionID
  const db = input.independent
    ? resourceRecoveryDb(input.payload)
    : id
      ? (adapter.sessions?.[id]?.db as typeof adapter.drizzle)
      : adapter.drizzle
  const table = sql`${sql.identifier(adapter.schemaName ?? 'payload')}."content_change_requests"`
  let expectedSha: string | null = input.parentSha
  let expectedStatus = 'open'

  for (;;) {
    // The conflict predicate runs under the Postgres row lock. A delayed save
    // cannot replace a newer commit that another CMS replica already recorded.
    const saved = await db.execute<{
      id: number
    }>(sql`INSERT INTO ${table} AS mirror
         (branch_name, content_type, target_path, pull_request_number, pull_request_url, commit_sha, created_by_id, status)
       VALUES (${input.branchName}, ${input.contentType}, ${input.targetPath}, ${input.pullRequestNumber}, ${input.pullRequestUrl}, ${input.commitSha}, ${input.editor?.payloadUserId ?? null}, 'open')
       ON CONFLICT (branch_name) DO UPDATE SET
         content_type = EXCLUDED.content_type, target_path = EXCLUDED.target_path,
         pull_request_number = EXCLUDED.pull_request_number, pull_request_url = EXCLUDED.pull_request_url,
         commit_sha = EXCLUDED.commit_sha, status = 'open', updated_at = NOW(),
         created_by_id = COALESCE(EXCLUDED.created_by_id, mirror.created_by_id)
       WHERE mirror.commit_sha IS NOT DISTINCT FROM ${expectedSha} AND mirror.status = ${expectedStatus}
       RETURNING id`)
    if (saved.rows[0]) return saved.rows[0].id

    const {
      rows: [mirror],
    } = await db.execute<{
      id: number
      commit_sha: string | null
      status: string
    }>(
      sql`SELECT id, commit_sha, status FROM ${table} WHERE branch_name = ${input.branchName}`
    )
    if (!mirror) continue
    const live = await readPr(input.pullRequestNumber)
    if (
      live.branchName !== input.branchName ||
      live.headSha !== input.commitSha
    )
      return mirror.id
    expectedSha = mirror.commit_sha
    expectedStatus = mirror.status
  }
}
