import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import {
  compareProductionToStaging,
  getBranchSyncDecision,
  loadGithubConfigFromEnv,
  setGithubConfig,
} from '@repo/content/github'

import config from '@payload-config'
import { syncProductionToStaging } from '@/services/content-workflow'

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

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

const requireUser = async (req: NextRequest): Promise<NextResponse | null> => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  return user
    ? null
    : NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
}

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const githubConfigResponse = loadGithubConfigResponse()
  if (githubConfigResponse) {
    return githubConfigResponse
  }

  const authResponse = await requireUser(req)
  if (authResponse) {
    return authResponse
  }

  try {
    const comparison = await compareProductionToStaging()
    return NextResponse.json({
      comparison,
      decision: getBranchSyncDecision(comparison),
    })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const githubConfigResponse = loadGithubConfigResponse()
  if (githubConfigResponse) {
    return githubConfigResponse
  }

  const authResponse = await requireUser(req)
  if (authResponse) {
    return authResponse
  }

  try {
    const result = await syncProductionToStaging()
    const status = result.decision.kind === 'blocked' ? 409 : 200
    return NextResponse.json(result, { status })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}
