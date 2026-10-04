import { loadJenkinsConfig, type JenkinsConfig } from './jenkins-config'
import type { PublishEnvironment } from './environments'
import type { PublishRun } from './publish-status'
import { DispatchUncertainError } from './dispatch-error'

interface JenkinsBuild {
  number: number
  building: boolean
  result: string | null
  timestamp: number
  duration: number
  artifacts?: Array<{ relativePath: string }>
}

interface JenkinsJob {
  builds: JenkinsBuild[]
  queueItem?: { id: number; inQueueSince: number } | null
}

const TREE =
  'builds[number,building,result,timestamp,duration,artifacts[relativePath]]{0,20},queueItem[id,inQueueSince]'

export const createJenkinsClient = (
  config: JenkinsConfig,
  request: typeof fetch = fetch
): {
  listRuns: (environment: PublishEnvironment) => Promise<PublishRun[]>
  dispatch: (
    environment: PublishEnvironment,
    previewBuild?: number
  ) => Promise<void>
} => {
  const send = async (url: string, init?: RequestInit): Promise<Response> => {
    const response = await request(url, {
      ...init,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      headers: { ...init?.headers, Authorization: config.authorization },
    }).catch((error: unknown) => {
      // A lost POST response does not establish that Jenkins rejected the build.
      if (init?.method === 'POST') throw new DispatchUncertainError(error)
      throw error
    })
    if (!response.ok)
      throw new Error(`Jenkins request failed (${response.status})`)
    return response
  }
  return {
    listRuns: async (environment) => {
      const jobUrl = config.jobs[environment]
      const response = await send(
        `${jobUrl}api/json?${new URLSearchParams({ tree: TREE })}`
      )
      const job = (await response.json()) as JenkinsJob
      if (!Array.isArray(job.builds))
        throw new Error('Jenkins returned an invalid job response')
      const runs: PublishRun[] = job.builds.map((build) => ({
        id: build.number,
        runUrl: `${jobUrl}${build.number}/`,
        state: build.building ? 'running' : 'finished',
        startedAt: new Date(build.timestamp).toISOString(),
        finishedAt: build.building
          ? null
          : new Date(build.timestamp + build.duration).toISOString(),
        conclusion: build.result,
        succeeded: !build.building && build.result === 'SUCCESS',
        hasSnapshot:
          build.artifacts?.some(
            (artifact) => artifact.relativePath === 'press-snapshot.json'
          ) ?? false,
      }))
      if (job.queueItem) {
        runs.unshift({
          id: -job.queueItem.id,
          runUrl: jobUrl,
          state: 'queued',
          startedAt: new Date(job.queueItem.inQueueSince).toISOString(),
          finishedAt: null,
          conclusion: null,
          succeeded: false,
          hasSnapshot: false,
        })
      }
      return runs
    },
    dispatch: async (environment, previewBuild) => {
      const body = new URLSearchParams({ SITE_PUBLISH: 'true' })
      if (previewBuild !== undefined)
        body.set('PREVIEW_BUILD', String(previewBuild))
      await send(`${config.jobs[environment]}buildWithParameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
    },
  }
}

export const getJenkinsClient = (): ReturnType<typeof createJenkinsClient> =>
  createJenkinsClient(loadJenkinsConfig())
