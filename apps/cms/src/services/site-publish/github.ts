import {
  getGithubConfig,
  getOctokit,
  PRESS_SNAPSHOT_ARTIFACT,
  SITE_PUBLISH_EVENT,
  SITE_PUBLISH_RUN_PREFIX,
  SITE_PUBLISH_WORKFLOW,
} from '@repo/content/github'
import type { PublishEnvironment } from './environments'
import type { PublishRun } from './publish-status'
import { DispatchUncertainError } from './dispatch-error'

export interface GithubWorkflowRun {
  id: number
  display_title: string
  html_url: string
  status: string | null
  conclusion: string | null
  event: string
  created_at: string
  run_started_at?: string
  updated_at: string
  head_branch: string | null
}

export interface GithubPublishApi {
  listRuns: () => Promise<readonly GithubWorkflowRun[]>
  listArtifacts: (runId: number) => Promise<
    readonly {
      name: string
      expired: boolean
      expires_at?: string | null
    }[]
  >
  dispatch: (payload: {
    environment: PublishEnvironment
    previewBuild?: number
  }) => Promise<void>
}

export const createGithubPublishClient = (
  api: GithubPublishApi,
  stagingBranch: string
): {
  listRuns: (environment: PublishEnvironment) => Promise<PublishRun[]>
  dispatch: (
    environment: PublishEnvironment,
    previewBuild?: number
  ) => Promise<void>
} => ({
  listRuns: async (environment) => {
    const runs: PublishRun[] = (await api.listRuns())
      .filter(
        (run) =>
          run.head_branch === stagingBranch &&
          ['repository_dispatch', 'workflow_dispatch'].includes(run.event) &&
          run.display_title === `${SITE_PUBLISH_RUN_PREFIX}${environment}`
      )
      .slice(0, 20)
      .map((run) => ({
        id: run.id,
        runUrl: run.html_url,
        state:
          run.status === 'completed'
            ? 'finished'
            : run.status === 'in_progress'
              ? 'running'
              : 'queued',
        startedAt: run.run_started_at ?? run.created_at,
        finishedAt: run.status === 'completed' ? run.updated_at : null,
        conclusion: run.conclusion,
        succeeded: run.status === 'completed' && run.conclusion === 'success',
        hasSnapshot: false,
      }))
    const latest = runs[0]
    if (environment === 'dev' && latest?.succeeded) {
      const artifacts = await api.listArtifacts(latest.id)
      runs[0] = {
        ...latest,
        hasSnapshot: artifacts.some(
          (artifact) =>
            artifact.name === PRESS_SNAPSHOT_ARTIFACT &&
            !artifact.expired &&
            (!artifact.expires_at ||
              Date.parse(artifact.expires_at) > Date.now())
        ),
      }
    }
    return runs
  },
  dispatch: async (environment, previewBuild) => {
    try {
      await api.dispatch({
        environment,
        ...(environment === 'production' ? { previewBuild } : {}),
      })
    } catch (error) {
      // A timeout or server error may follow an accepted dispatch. Never retry it automatically.
      const status =
        error && typeof error === 'object' && 'status' in error
          ? error.status
          : undefined
      if (typeof status !== 'number' || status >= 500)
        throw new DispatchUncertainError(error)
      throw error
    }
  },
})

export const getGithubPublishClient = (): ReturnType<
  typeof createGithubPublishClient
> => {
  const { owner, repo, stagingBranch } = getGithubConfig()
  const octokit = getOctokit()
  return createGithubPublishClient(
    {
      listRuns: async () =>
        (
          await octokit.rest.actions.listWorkflowRuns({
            owner,
            repo,
            workflow_id: SITE_PUBLISH_WORKFLOW,
            branch: stagingBranch,
            per_page: 100,
          })
        ).data.workflow_runs,
      listArtifacts: async (runId) =>
        (
          await octokit.rest.actions.listWorkflowRunArtifacts({
            owner,
            repo,
            run_id: runId,
            per_page: 100,
          })
        ).data.artifacts,
      dispatch: async (payload) => {
        await octokit.rest.repos.createDispatchEvent({
          owner,
          repo,
          event_type: SITE_PUBLISH_EVENT,
          client_payload: payload,
          request: { timeout: 15_000 },
        })
      },
    },
    stagingBranch
  )
}
