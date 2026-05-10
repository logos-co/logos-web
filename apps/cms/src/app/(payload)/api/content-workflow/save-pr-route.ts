import { NextResponse, type NextRequest } from 'next/server'
import { getPayload, type Payload, type User } from 'payload'

import { loadGithubConfigFromEnv, setGithubConfig } from '@repo/content/github'

import config from '@payload-config'
import type { SaveAsPullRequestResult } from '@/services/content-workflow'

interface SavePrEditor {
  email?: string
  payloadUserId?: string | number
}

interface SavePrRouteOptions<TDoc> {
  collection: string
  loadErrorLabel: string
  save: (input: {
    doc: TDoc
    editor: SavePrEditor
    payload: Payload
  }) => Promise<SaveAsPullRequestResult>
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const parseBodyId = async (
  req: NextRequest
): Promise<NextResponse | string> => {
  let body: { id?: string }
  try {
    body = (await req.json()) as { id?: string }
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'missing "id"' }, { status: 400 })
  }

  return body.id
}

const loadGithubConfigResponse = (): NextResponse | null => {
  try {
    setGithubConfig(loadGithubConfigFromEnv())
    return null
  } catch (error) {
    return NextResponse.json(
      { error: `GitHub config not loaded: ${getErrorMessage(error)}` },
      { status: 500 }
    )
  }
}

const getEditor = (user: User): SavePrEditor => ({
  email: typeof user.email === 'string' ? user.email : undefined,
  payloadUserId: user.id,
})

const serializeSaveResult = (result: SaveAsPullRequestResult) => ({
  branchName: result.branchName,
  pullRequestNumber: result.pullRequestNumber,
  pullRequestUrl: result.pullRequestUrl,
  commitSha: result.commitSha,
  contentChangeRequestId: result.contentChangeRequestId,
})

export const createSavePrRoute =
  <TDoc>({ collection, loadErrorLabel, save }: SavePrRouteOptions<TDoc>) =>
  async (req: NextRequest): Promise<NextResponse> => {
    const idOrResponse = await parseBodyId(req)
    if (typeof idOrResponse !== 'string') {
      return idOrResponse
    }

    const githubConfigResponse = loadGithubConfigResponse()
    if (githubConfigResponse) {
      return githubConfigResponse
    }

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    let doc: TDoc
    try {
      doc = (await payload.findByID({
        collection,
        id: idOrResponse,
        depth: 0,
      })) as unknown as TDoc
    } catch (error) {
      return NextResponse.json(
        {
          error: `failed to load ${loadErrorLabel} ${idOrResponse}: ${getErrorMessage(
            error
          )}`,
        },
        { status: 404 }
      )
    }

    try {
      const result = await save({
        doc,
        payload,
        editor: getEditor(user),
      })
      return NextResponse.json(serializeSaveResult(result))
    } catch (error) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 422 }
      )
    }
  }
