import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import {
  findOpenPullRequestsTouchingPath,
  loadGithubConfigFromEnv,
  setGithubConfig,
} from '@repo/content/github'

import config from '@payload-config'

type ChangeRequestDoc = {
  id: string | number
  contentType?: string | null
  targetPath?: string | null
  branchName?: string | null
  pullRequestNumber?: number | null
  pullRequestUrl?: string | null
  status?: string | null
  updatedAt?: string | null
}

const COLLECTION_CONTENT_TYPES: Record<string, string[]> = {
  circles: ['circle'],
  'circle-events': ['circle-event'],
  'circle-initiatives': ['circle-initiative'],
  'circle-resources': ['circle-resource'],
  ideas: ['idea'],
  rfps: ['rfp'],
}

const COLLECTION_CONTENT_DIRS: Record<string, string> = {
  circles: 'content/circles/circles',
  'circle-events': 'content/circles/events',
  'circle-initiatives': 'content/circles/initiatives',
  ideas: 'content/builders-hub/ideas',
  rfps: 'content/builders-hub/rfps',
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const matchesSlug = (doc: ChangeRequestDoc, slug: string): boolean => {
  const branchName = doc.branchName ?? ''
  const targetPath = doc.targetPath ?? ''
  return branchName.includes(slug) || targetPath.includes(`/${slug}/`)
}

const buildTargetPath = (collection: string, slug: string): string | null => {
  const contentDir = COLLECTION_CONTENT_DIRS[collection]
  return contentDir ? `${contentDir}/${slug}/index.json` : null
}

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const collection = searchParams.get('collection')
  const slug = searchParams.get('slug')
  if (!collection || !COLLECTION_CONTENT_TYPES[collection]) {
    return NextResponse.json(
      { error: 'unsupported or missing collection' },
      { status: 400 }
    )
  }

  const contentTypes = new Set(COLLECTION_CONTENT_TYPES[collection])
  const [result, livePullRequests] = await Promise.all([
    payload.find({
      collection: 'content-change-requests',
      depth: 0,
      limit: 100,
      sort: '-updatedAt',
      where: {
        status: {
          equals: 'open',
        },
      },
    }),
    (async () => {
      if (!slug) return []
      const targetPath = buildTargetPath(collection, slug)
      if (!targetPath) return []

      try {
        setGithubConfig(loadGithubConfigFromEnv())
        return findOpenPullRequestsTouchingPath(targetPath)
      } catch (error) {
        throw new Error(`GitHub PR lookup failed: ${getErrorMessage(error)}`, {
          cause: error,
        })
      }
    })(),
  ])

  const cachedPullRequests = (result.docs as unknown as ChangeRequestDoc[])
    .filter((doc) => contentTypes.has(doc.contentType ?? ''))
    .filter((doc) => !slug || matchesSlug(doc, slug))
    .filter((doc) => doc.pullRequestUrl)
    .map((doc) => ({
      id: doc.id,
      branchName: doc.branchName,
      contentType: doc.contentType,
      pullRequestNumber: doc.pullRequestNumber,
      pullRequestUrl: doc.pullRequestUrl,
      status: doc.status,
      targetPath: doc.targetPath,
      updatedAt: doc.updatedAt,
    }))

  const liveByNumber = new Map(
    livePullRequests.map((pr) => [
      pr.number,
      {
        id: `github-${pr.number}`,
        branchName: pr.branchName,
        contentType: COLLECTION_CONTENT_TYPES[collection][0],
        draft: pr.draft,
        pullRequestNumber: pr.number,
        pullRequestUrl: pr.htmlUrl,
        status: pr.state,
        targetPath: slug ? buildTargetPath(collection, slug) : null,
        updatedAt: null,
      },
    ])
  )

  for (const pr of cachedPullRequests) {
    if (pr.pullRequestNumber) {
      liveByNumber.delete(pr.pullRequestNumber)
    }
  }

  const pullRequests = [
    ...Array.from(liveByNumber.values()),
    ...cachedPullRequests,
  ].slice(0, 3)

  return NextResponse.json({ pullRequests })
}
