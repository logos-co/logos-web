import { getGithubConfig, getOctokit } from '@repo/content/github'

import {
  PUBLISH_DISPATCH_TYPE,
  PUBLISH_WORKFLOW_FILE,
  type PublishEnvironment,
} from './environments'
import type { WorkflowRun } from './publish-status'

/** Enough history to find the last publish of each site and its duration. */
const RUNS_PER_PAGE = 20

interface GithubWorkflowRun {
  conclusion: string | null
  display_title?: string
  html_url: string
  id: number
  name?: string | null
  run_started_at?: string
  status: string | null
  updated_at: string
}

const toWorkflowRun = (run: GithubWorkflowRun): WorkflowRun => ({
  conclusion: run.conclusion,
  display_title: run.display_title ?? null,
  html_url: run.html_url,
  id: run.id,
  name: run.name ?? null,
  run_started_at: run.run_started_at ?? null,
  status: run.status,
  updated_at: run.updated_at,
})

/** Reads the runs as the Github App, which has the larger rate limit. */
export const listPublishRuns = async (): Promise<WorkflowRun[]> => {
  const { owner, repo } = getGithubConfig()
  const response = await getOctokit().actions.listWorkflowRuns({
    owner,
    per_page: RUNS_PER_PAGE,
    repo,
    workflow_id: PUBLISH_WORKFLOW_FILE,
  })
  return response.data.workflow_runs.map(toWorkflowRun)
}

/**
 * The same list without credentials. logos-web is public, so this works when
 * the app has no Actions permission, at 60 calls an hour for the server.
 */
export const listPublicPublishRuns = async (): Promise<WorkflowRun[]> => {
  const { owner, repo } = getGithubConfig()
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${PUBLISH_WORKFLOW_FILE}/runs?per_page=${RUNS_PER_PAGE}`,
    { headers: { Accept: 'application/vnd.github+json' } }
  )
  if (!response.ok) {
    throw new Error(
      `Github answered ${response.status} for the publish runs${
        response.status === 403 ? ' (rate limit)' : ''
      }`
    )
  }
  const body = (await response.json()) as {
    workflow_runs?: GithubWorkflowRun[]
  }
  return (body.workflow_runs ?? []).map(toWorkflowRun)
}

/** Asks Github to start the publish workflow for one site. */
export const dispatchPublish = async (
  environment: PublishEnvironment
): Promise<void> => {
  const { owner, repo } = getGithubConfig()
  await getOctokit().repos.createDispatchEvent({
    client_payload: { environment },
    event_type: PUBLISH_DISPATCH_TYPE,
    owner,
    repo,
  })
}
