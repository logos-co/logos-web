import { getManagedPullRequest } from '@repo/content/github'
import type { Payload } from 'payload'

interface SavedContentChange {
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
  const { pool, schemaName } = input.payload.db
  const schema = (schemaName ?? 'payload').replaceAll('"', '""')
  const table = `"${schema}"."content_change_requests"`
  let expectedSha: string | null = input.parentSha
  let expectedStatus = 'open'

  for (;;) {
    // The conflict predicate runs under the Postgres row lock. A delayed save
    // cannot replace a newer commit that another CMS replica already recorded.
    const saved = await pool.query<{ id: number }>(
      `INSERT INTO ${table} AS mirror
         (branch_name, content_type, target_path, pull_request_number, pull_request_url, commit_sha, created_by_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
       ON CONFLICT (branch_name) DO UPDATE SET
         content_type = EXCLUDED.content_type, target_path = EXCLUDED.target_path,
         pull_request_number = EXCLUDED.pull_request_number, pull_request_url = EXCLUDED.pull_request_url,
         commit_sha = EXCLUDED.commit_sha, status = 'open', updated_at = NOW(),
         created_by_id = COALESCE(EXCLUDED.created_by_id, mirror.created_by_id)
       WHERE mirror.commit_sha IS NOT DISTINCT FROM $8 AND mirror.status = $9
       RETURNING id`,
      [
        input.branchName,
        input.contentType,
        input.targetPath,
        input.pullRequestNumber,
        input.pullRequestUrl,
        input.commitSha,
        input.editor?.payloadUserId ?? null,
        expectedSha,
        expectedStatus,
      ]
    )
    if (saved.rows[0]) return saved.rows[0].id

    const {
      rows: [mirror],
    } = await pool.query<{
      id: number
      commit_sha: string | null
      status: string
    }>(`SELECT id, commit_sha, status FROM ${table} WHERE branch_name = $1`, [
      input.branchName,
    ])
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
