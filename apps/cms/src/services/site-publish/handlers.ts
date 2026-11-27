import { NextResponse, type NextRequest } from 'next/server'
import { isPublishEnvironment } from './environments'
import { PublishBlockedError } from './trigger-publish'
import { getEditorErrorMessage, logWorkflowError } from '../github-errors'
import type { loadPublishStatus, triggerPublish } from './index'

export interface SitePublishRouteDependencies {
  authenticate: (headers: Headers) => Promise<{ id: number } | null>
  loadPublishStatus: typeof loadPublishStatus
  recordProductionPublish: (userId: number) => Promise<void>
  triggerPublish: typeof triggerPublish
}

export const createSitePublishHandlers = (
  dependencies: SitePublishRouteDependencies
): {
  GET: (req: NextRequest) => Promise<NextResponse>
  POST: (req: NextRequest) => Promise<NextResponse>
} => {
  const unauthenticated = (): NextResponse =>
    NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const failure = (error: unknown): NextResponse =>
    NextResponse.json(
      {
        error: getEditorErrorMessage(
          error,
          'Site publishing failed',
          'site-publish'
        ),
      },
      { status: error instanceof PublishBlockedError ? 409 : 502 }
    )
  return {
    GET: async (req) => {
      if (!(await dependencies.authenticate(req.headers)))
        return unauthenticated()
      try {
        return NextResponse.json(await dependencies.loadPublishStatus(), {
          headers: { 'Cache-Control': 'no-store' },
        })
      } catch (error) {
        return failure(error)
      }
    },
    POST: async (req) => {
      const user = await dependencies.authenticate(req.headers)
      if (!user) return unauthenticated()
      // Custom Next routes do not inherit Payload's endpoint CSRF checks.
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
      const body: unknown = await req.json().catch(() => null)
      if (
        !body ||
        typeof body !== 'object' ||
        !('environment' in body) ||
        !isPublishEnvironment(body.environment)
      ) {
        return NextResponse.json(
          { error: 'environment must be "dev" or "production"' },
          { status: 400 }
        )
      }
      const previewBuild =
        'previewBuild' in body ? body.previewBuild : undefined
      if (
        body.environment === 'production' &&
        (typeof previewBuild !== 'number' ||
          !Number.isSafeInteger(previewBuild) ||
          previewBuild < 1)
      ) {
        return NextResponse.json(
          { error: 'Review a staging preview before publishing live' },
          { status: 400 }
        )
      }
      let result: Awaited<ReturnType<typeof dependencies.triggerPublish>>
      try {
        result = await dependencies.triggerPublish(
          body.environment,
          typeof previewBuild === 'number' ? previewBuild : undefined
        )
      } catch (error) {
        return failure(error)
      }
      if (body.environment === 'production') {
        await dependencies
          .recordProductionPublish(user.id)
          .catch((error: unknown) =>
            logWorkflowError('site-publish audit', error)
          )
      }
      return NextResponse.json(result, { status: 202 })
    },
  }
}
