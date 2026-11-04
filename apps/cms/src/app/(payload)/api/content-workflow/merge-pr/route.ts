import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { loadGithubConfigFromEnv, setGithubConfig } from '@repo/content/github'

import { mergeContentPullRequest } from '@/services/content-workflow'

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

export interface MergePrRouteDependencies {
  getPayload: () => Promise<PayloadClient>
  loadGithubConfigFromEnv: typeof loadGithubConfigFromEnv
  mergeContentPullRequest: typeof mergeContentPullRequest
  setGithubConfig: typeof setGithubConfig
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const loadGithubConfigResponse = ({
  loadGithubConfigFromEnv,
  setGithubConfig,
}: Pick<
  MergePrRouteDependencies,
  'loadGithubConfigFromEnv' | 'setGithubConfig'
>): NextResponse | null => {
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

const parseMergeRequest = async (
  req: NextRequest
): Promise<NextResponse | { pullRequestNumber: number; headSha: string }> => {
  if (
    req.headers.get('sec-fetch-site') !== 'same-origin' ||
    req.headers.get('content-type')?.split(';')[0]?.trim() !==
      'application/json'
  ) {
    return NextResponse.json(
      { error: 'A same-origin JSON request is required' },
      { status: 403 }
    )
  }
  let body: { pullRequestNumber?: number; headSha?: string } | null
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (
    !body ||
    !Number.isInteger(body.pullRequestNumber) ||
    Number(body.pullRequestNumber) < 1
  ) {
    return NextResponse.json(
      { error: 'missing or invalid "pullRequestNumber"' },
      { status: 400 }
    )
  }

  if (
    typeof body.headSha !== 'string' ||
    !/^[a-f0-9]{40}$/.test(body.headSha)
  ) {
    return NextResponse.json({ error: 'Invalid PR head SHA' }, { status: 400 })
  }
  return {
    pullRequestNumber: Number(body.pullRequestNumber),
    headSha: body.headSha,
  }
}

export const createMergePrPostHandler =
  ({
    getPayload,
    loadGithubConfigFromEnv,
    mergeContentPullRequest,
    setGithubConfig,
  }: MergePrRouteDependencies) =>
  async (req: NextRequest): Promise<NextResponse> => {
    const request = await parseMergeRequest(req)
    if (request instanceof NextResponse) {
      return request
    }

    const githubConfigResponse = loadGithubConfigResponse({
      loadGithubConfigFromEnv,
      setGithubConfig,
    })
    if (githubConfigResponse) {
      return githubConfigResponse
    }

    const payload = await getPayload()
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    try {
      const result = await mergeContentPullRequest({
        payload,
        ...request,
      })
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 422 }
      )
    }
  }

export const POST = createMergePrPostHandler({
  getPayload: async () => {
    const { default: config } = await import('@payload-config')
    return getPayload({ config })
  },
  loadGithubConfigFromEnv,
  mergeContentPullRequest,
  setGithubConfig,
})
