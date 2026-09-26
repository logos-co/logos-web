import {
  buildPublishStatus,
  type PublishStatus,
  type WorkflowRun,
} from './publish-status'

/**
 * Where the run list came from. The Github App has a generous rate limit; the
 * public API allows 60 calls an hour for the whole server, so its answers are
 * held longer.
 */
export type PublishStatusSource = 'app' | 'public'

export interface PublishStatusResult {
  fetchedAt: string
  source: PublishStatusSource
  status: PublishStatus
}

export interface LoadPublishStatusDependencies {
  listPublicRuns: () => Promise<WorkflowRun[]>
  listRuns: () => Promise<WorkflowRun[]>
  now?: () => number
}

const CACHE_MS: Record<PublishStatusSource, number> = {
  app: 5_000,
  public: 45_000,
}

let cache: { expiresAt: number; result: PublishStatusResult } | null = null

/** Also used after triggering a publish, so the new run shows up at once. */
export const __resetPublishStatusCacheForTests = (): void => {
  cache = null
}

export const clearPublishStatusCache = __resetPublishStatusCacheForTests

const readRuns = async ({
  listPublicRuns,
  listRuns,
}: LoadPublishStatusDependencies): Promise<{
  runs: WorkflowRun[]
  source: PublishStatusSource
}> => {
  try {
    return { runs: await listRuns(), source: 'app' }
  } catch {
    // The app has no Actions permission on this repository. The repository is
    // public, so read the runs the way anyone can.
    return { runs: await listPublicRuns(), source: 'public' }
  }
}

export const createLoadPublishStatus = (
  dependencies: LoadPublishStatusDependencies
): (() => Promise<PublishStatusResult>) => {
  const now = dependencies.now ?? Date.now

  return async () => {
    const current = now()
    if (cache && cache.expiresAt > current) return cache.result

    const { runs, source } = await readRuns(dependencies)
    const result: PublishStatusResult = {
      fetchedAt: new Date(current).toISOString(),
      source,
      status: buildPublishStatus(runs),
    }
    cache = { expiresAt: current + CACHE_MS[source], result }
    return result
  }
}
