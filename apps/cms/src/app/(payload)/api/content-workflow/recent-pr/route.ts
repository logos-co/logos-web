import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import {
  listManagedPullRequests,
  loadGithubConfigFromEnv,
  setGithubConfig,
} from '@repo/content/github'

import {
  getContentWorkflowCollection,
  getContentWorkflowTargetPath,
} from '@/services/content-workflow/collection-metadata'
import { matchesRecentPullRequestScope } from '@/services/content-workflow/recent-pr-matching'

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

export interface RecentPrRouteDependencies {
  listManagedPullRequests: typeof listManagedPullRequests
  getPayload: () => Promise<PayloadClient>
  loadGithubConfigFromEnv: typeof loadGithubConfigFromEnv
  setGithubConfig: typeof setGithubConfig
}

type ChangeRequestDoc = {
  id: string | number
  contentType?: string | null
  targetPath?: string | null
  commitSha?: string | null
  branchName?: string | null
  pullRequestNumber?: number | null
  pullRequestUrl?: string | null
  status?: string | null
  updatedAt?: string | null
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export const createRecentPrGetHandler =
  ({
    listManagedPullRequests,
    getPayload,
    loadGithubConfigFromEnv,
    setGithubConfig,
  }: RecentPrRouteDependencies) =>
  async (req: NextRequest): Promise<NextResponse> => {
    const payload = await getPayload()
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const collection = searchParams.get('collection')
    const slug = searchParams.get('slug')
    const page = searchParams.get('page')
    const metadata = collection
      ? getContentWorkflowCollection(collection)
      : null
    if (!collection || !metadata) {
      return NextResponse.json(
        { error: 'unsupported or missing collection' },
        { status: 400 }
      )
    }

    const contentTypes = new Set(metadata.contentTypes)
    const targetPath = getContentWorkflowTargetPath(collection, {
      page,
      slug,
    })
    let result: Awaited<ReturnType<typeof payload.find>>
    let livePullRequests: Awaited<ReturnType<typeof listManagedPullRequests>>
    try {
      const lookupResults = await Promise.all([
        payload.find({
          collection: 'content-change-requests',
          depth: 0,
          limit: 100,
          sort: '-updatedAt',
          where: {
            contentType: { in: [...contentTypes] },
            ...(targetPath && { targetPath: { equals: targetPath } }),
            status: {
              equals: 'open',
            },
          },
        }),
        (async () => {
          setGithubConfig(loadGithubConfigFromEnv())
          return listManagedPullRequests()
        })(),
      ])
      result = lookupResults[0]
      livePullRequests = lookupResults[1]
    } catch (error) {
      return NextResponse.json(
        { error: `GitHub PR lookup failed: ${getErrorMessage(error)}` },
        { status: 500 }
      )
    }

    const live = new Map(livePullRequests.map((pr) => [pr.number, pr]))
    const pullRequests = (result.docs as unknown as ChangeRequestDoc[])
      .filter((doc) => contentTypes.has(doc.contentType ?? ''))
      .filter((doc) =>
        matchesRecentPullRequestScope(doc, {
          slug,
          targetPath,
        })
      )
      .flatMap((doc) => {
        const pr = doc.pullRequestNumber && live.get(doc.pullRequestNumber)
        if (
          !pr ||
          pr.branchName !== doc.branchName ||
          pr.headSha !== doc.commitSha
        )
          return []
        return [
          {
            id: doc.id,
            branchName: pr.branchName,
            contentType: doc.contentType,
            headSha: pr.headSha,
            pullRequestNumber: pr.number,
            pullRequestUrl: pr.htmlUrl,
            draft: pr.draft,
            status: doc.status,
            targetPath: doc.targetPath,
            updatedAt: doc.updatedAt,
          },
        ]
      })
      .slice(0, 3)

    return NextResponse.json({ pullRequests })
  }

export const GET = createRecentPrGetHandler({
  listManagedPullRequests,
  getPayload: async () => {
    const { default: config } = await import('@payload-config')
    return getPayload({ config })
  },
  loadGithubConfigFromEnv,
  setGithubConfig,
})
