import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { loadGithubConfigFromEnv, setGithubConfig } from '@repo/content/github'

import {
  isPublishEnvironment,
  loadPublishStatus,
  PublishBlockedError,
  triggerPublish,
} from '@/services/site-publish'

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

export interface SitePublishRouteDependencies {
  getPayload: () => Promise<PayloadClient>
  loadGithubConfigFromEnv: typeof loadGithubConfigFromEnv
  loadPublishStatus: typeof loadPublishStatus
  setGithubConfig: typeof setGithubConfig
  triggerPublish: typeof triggerPublish
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const loadGithubConfigResponse = ({
  loadGithubConfigFromEnv,
  setGithubConfig,
}: Pick<
  SitePublishRouteDependencies,
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

const requireUser = async ({
  getPayload,
  req,
}: {
  getPayload: SitePublishRouteDependencies['getPayload']
  req: NextRequest
}): Promise<NextResponse | null> => {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: req.headers })
  return user
    ? null
    : NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
}

export const createSitePublishHandlers = (
  dependencies: SitePublishRouteDependencies
): {
  GET: (req: NextRequest) => Promise<NextResponse>
  POST: (req: NextRequest) => Promise<NextResponse>
} => {
  const prepare = async (req: NextRequest): Promise<NextResponse | null> =>
    loadGithubConfigResponse(dependencies) ??
    (await requireUser({ getPayload: dependencies.getPayload, req }))

  const GET = async (req: NextRequest): Promise<NextResponse> => {
    const blocked = await prepare(req)
    if (blocked) return blocked

    try {
      return NextResponse.json(await dependencies.loadPublishStatus())
    } catch (error) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 502 }
      )
    }
  }

  const POST = async (req: NextRequest): Promise<NextResponse> => {
    const blocked = await prepare(req)
    if (blocked) return blocked

    const body = (await req.json().catch(() => null)) as {
      environment?: unknown
    } | null
    if (!isPublishEnvironment(body?.environment)) {
      return NextResponse.json(
        { error: 'environment must be "dev" or "production"' },
        { status: 400 }
      )
    }

    try {
      return NextResponse.json(
        await dependencies.triggerPublish(body.environment)
      )
    } catch (error) {
      const status = error instanceof PublishBlockedError ? 409 : 502
      return NextResponse.json({ error: getErrorMessage(error) }, { status })
    }
  }

  return { GET, POST }
}

const handlers = createSitePublishHandlers({
  getPayload: async () => {
    const { default: config } = await import('@payload-config')
    return getPayload({ config })
  },
  loadGithubConfigFromEnv,
  loadPublishStatus,
  setGithubConfig,
  triggerPublish,
})

export const GET = handlers.GET
export const POST = handlers.POST
