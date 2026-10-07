import { appendFile, readFile } from 'node:fs/promises'
import {
  PRESS_SNAPSHOT_ARTIFACT,
  SITE_PUBLISH_RUN_PREFIX,
  SITE_PUBLISH_WORKFLOW,
} from '../../packages/content/src/github/site-publish-settings.ts'
import {
  publicationInput,
  validateReviewedRun,
  type ReviewedRun,
} from './input.mts'

const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`${key} is required`)
  return value
}

const github = async <T,>(path: string): Promise<T> => {
  const response = await fetch(
    `https://api.github.com/repos/${required('GITHUB_REPOSITORY')}/${path}`,
    {
      headers: {
        Authorization: `Bearer ${required('GITHUB_TOKEN')}`,
        Accept: 'application/vnd.github+json',
      },
      signal: AbortSignal.timeout(15_000),
    }
  )
  if (!response.ok)
    throw new Error(`GitHub request failed (${response.status})`)
  return (await response.json()) as T
}

const input = publicationInput(
  JSON.parse(await readFile(required('GITHUB_EVENT_PATH'), 'utf8'))
)
if (input.environment === 'production') {
  const run = await github<ReviewedRun>(`actions/runs/${input.previewBuild}`)
  const history = await github<{ workflow_runs: ReviewedRun[] }>(
    `actions/workflows/${SITE_PUBLISH_WORKFLOW}/runs?branch=develop&per_page=100`
  )
  const latest = history.workflow_runs.find(
    (item) =>
      item.display_title === `${SITE_PUBLISH_RUN_PREFIX}dev` &&
      ['repository_dispatch', 'workflow_dispatch'].includes(item.event)
  )
  validateReviewedRun(run, latest?.id)
  const { artifacts } = await github<{
    artifacts: Array<{ name: string; expired: boolean; expires_at: string }>
  }>(`actions/runs/${input.previewBuild}/artifacts?per_page=100`)
  if (
    !artifacts.some(
      (artifact) =>
        artifact.name === PRESS_SNAPSHOT_ARTIFACT &&
        !artifact.expired &&
        Date.parse(artifact.expires_at) > Date.now()
    )
  )
    throw new Error(
      'The reviewed snapshot has expired. Build a new staging preview.'
    )
}
const live = input.environment === 'production'
await appendFile(
  required('GITHUB_OUTPUT'),
  [
    `environment=${input.environment}`,
    `source_ref=${live ? 'master' : 'develop'}`,
    `deploy_branch=${live ? 'deploy-master' : 'deploy-develop'}`,
    `site_url=https://${live ? 'logos.co' : 'dev.logos.co'}`,
    `api_mode=${live ? 'production' : 'staging'}`,
    `api_url=${live ? 'https://logos-web-api.vercel.app' : 'https://logos-web-api-git-develop-status-im-web.vercel.app'}`,
    `preview_build=${input.previewBuild ?? ''}`,
  ].join('\n') + '\n'
)
