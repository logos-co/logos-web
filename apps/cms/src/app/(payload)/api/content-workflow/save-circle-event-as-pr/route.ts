import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { loadGithubConfigFromEnv, setGithubConfig } from '@repo/content/github'

import config from '@payload-config'

import {
  saveCircleEventAsPullRequest,
  type CircleEventDocLike,
} from '../../../../../services/content-workflow'

/**
 * POST /api/content-workflow/save-circle-event-as-pr
 *
 * Body: `{ id: string }` — the Payload CircleEvent document id.
 *
 * Authenticates via the standard Payload session cookie. Loads the doc,
 * builds the fixture pair, and creates a draft PR on the configured base
 * branch. Responds with the PR URL on success.
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  let body: { id?: string }
  try {
    body = (await req.json()) as { id?: string }
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'missing "id"' }, { status: 400 })
  }

  try {
    setGithubConfig(loadGithubConfigFromEnv())
  } catch (err) {
    return NextResponse.json(
      {
        error: `GitHub config not loaded: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 500 }
    )
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let doc: CircleEventDocLike
  try {
    doc = (await payload.findByID({
      collection: 'circle-events',
      id: body.id,
      depth: 0,
    })) as unknown as CircleEventDocLike
  } catch (err) {
    return NextResponse.json(
      {
        error: `failed to load CircleEvent ${body.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 404 }
    )
  }

  try {
    const result = await saveCircleEventAsPullRequest({
      doc,
      payload,
      editor: {
        email: typeof user.email === 'string' ? user.email : undefined,
        payloadUserId: user.id,
      },
    })
    return NextResponse.json({
      branchName: result.branchName,
      pullRequestNumber: result.pullRequestNumber,
      pullRequestUrl: result.pullRequestUrl,
      commitSha: result.commitSha,
      contentChangeRequestId: result.contentChangeRequestId,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 422 }
    )
  }
}
