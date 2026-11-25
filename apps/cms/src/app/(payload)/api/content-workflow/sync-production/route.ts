import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import {
  type BranchSyncComparison,
  type BranchSyncDecision,
  compareProductionToStaging,
  getBranchSyncLinks,
  getBranchSyncDecision,
  loadGithubConfigFromEnv,
  setGithubConfig,
} from '@repo/content/github'

import { syncProductionToStaging } from '@/services/content-workflow'
import { recordPromotion } from '@/services/content-workflow/record-release'
import {
  githubConfigErrorResponse,
  logWorkflowError,
} from '@/services/github-errors'

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

export interface SyncProductionRouteDependencies {
  compareProductionToStaging: typeof compareProductionToStaging
  getBranchSyncDecision: (
    comparison: BranchSyncComparison
  ) => BranchSyncDecision
  getBranchSyncLinks: typeof getBranchSyncLinks
  getPayload: () => Promise<PayloadClient>
  loadGithubConfigFromEnv: typeof loadGithubConfigFromEnv
  recordPromotion: typeof recordPromotion
  setGithubConfig: typeof setGithubConfig
  syncProductionToStaging: typeof syncProductionToStaging
}

export const PROMOTION_NOT_ENABLED_MESSAGE =
  'Content promotion is not enabled yet, so the CMS opened a release PR instead. Ask an admin to enable content promotion, or have a maintainer review and merge the release PR.'
export const RELEASE_PR_MESSAGE =
  'The changes include more than content, so the CMS opened a release PR. A maintainer has to review and merge it.'

const loadGithubConfigResponse = ({
  loadGithubConfigFromEnv,
  setGithubConfig,
}: Pick<
  SyncProductionRouteDependencies,
  'loadGithubConfigFromEnv' | 'setGithubConfig'
>): NextResponse | null => {
  try {
    setGithubConfig(loadGithubConfigFromEnv())
    return null
  } catch (error) {
    return githubConfigErrorResponse('sync-production', error)
  }
}

const authenticate = async ({
  getPayload,
  req,
}: {
  getPayload: SyncProductionRouteDependencies['getPayload']
  req: NextRequest
}) => {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: req.headers })
  return user ? { payload, user } : null
}

const unauthenticated = (): NextResponse =>
  NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

const isSameOriginJson = (req: NextRequest): boolean =>
  req.headers.get('sec-fetch-site') === 'same-origin' &&
  req.headers.get('content-type')?.split(';')[0]?.trim() === 'application/json'

export const createSyncProductionHandlers = ({
  compareProductionToStaging,
  getBranchSyncDecision,
  getBranchSyncLinks,
  getPayload,
  loadGithubConfigFromEnv,
  recordPromotion,
  setGithubConfig,
  syncProductionToStaging,
}: SyncProductionRouteDependencies): {
  GET: (req: NextRequest) => Promise<NextResponse>
  POST: (req: NextRequest) => Promise<NextResponse>
} => {
  const GET = async (req: NextRequest): Promise<NextResponse> => {
    if (!(await authenticate({ getPayload, req }))) return unauthenticated()

    const githubConfigResponse = loadGithubConfigResponse({
      loadGithubConfigFromEnv,
      setGithubConfig,
    })
    if (githubConfigResponse) {
      return githubConfigResponse
    }

    try {
      const comparison = await compareProductionToStaging()
      const githubConfig = loadGithubConfigFromEnv()
      return NextResponse.json({
        comparison,
        decision: getBranchSyncDecision(comparison),
        links: getBranchSyncLinks({
          owner: githubConfig.owner,
          repo: githubConfig.repo,
          productionBranch: comparison.productionBranch,
          stagingBranch: comparison.stagingBranch,
        }),
      })
    } catch (error) {
      logWorkflowError('sync-production', error)
      return NextResponse.json(
        { error: 'GitHub branch status is unavailable' },
        { status: 502 }
      )
    }
  }

  const POST = async (req: NextRequest): Promise<NextResponse> => {
    if (!isSameOriginJson(req)) {
      return NextResponse.json(
        { error: 'A same-origin JSON request is required' },
        { status: 403 }
      )
    }

    const session = await authenticate({ getPayload, req })
    if (!session) return unauthenticated()

    const githubConfigResponse = loadGithubConfigResponse({
      loadGithubConfigFromEnv,
      setGithubConfig,
    })
    if (githubConfigResponse) {
      return githubConfigResponse
    }

    let result: Awaited<ReturnType<typeof syncProductionToStaging>>
    try {
      result = await syncProductionToStaging({
        onFastForwardRefused: (error) =>
          logWorkflowError('sync-production fast-forward refused', error),
      })
    } catch (error) {
      logWorkflowError('sync-production', error)
      return NextResponse.json(
        { error: 'Production could not be updated. Try again later.' },
        { status: 502 }
      )
    }

    if (result.promotion?.kind === 'fast-forward') {
      // Production already moved; a failed audit write must not report a failed promotion.
      await recordPromotion({
        payload: session.payload,
        userId: Number(session.user.id),
      }).catch((error: unknown) =>
        logWorkflowError('sync-production audit', error)
      )
    }
    const message =
      result.promotion?.kind === 'release-pr'
        ? result.promotion.reason === 'fast-forward-refused'
          ? PROMOTION_NOT_ENABLED_MESSAGE
          : RELEASE_PR_MESSAGE
        : undefined
    const status = result.decision.kind === 'blocked' ? 409 : 200
    return NextResponse.json(
      { ...result, ...(message && { message }) },
      { status }
    )
  }

  return { GET, POST }
}

const handlers = createSyncProductionHandlers({
  compareProductionToStaging,
  getBranchSyncDecision,
  getBranchSyncLinks,
  getPayload: async () => {
    const { default: config } = await import('@payload-config')
    return getPayload({ config })
  },
  loadGithubConfigFromEnv,
  recordPromotion,
  setGithubConfig,
  syncProductionToStaging,
})

export const GET = handlers.GET
export const POST = handlers.POST
