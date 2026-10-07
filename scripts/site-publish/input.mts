import {
  SITE_PUBLISH_RUN_PREFIX,
  SITE_PUBLISH_WORKFLOW,
} from '../../packages/content/src/github/site-publish-settings.ts'

export type SitePublishEnvironment = 'dev' | 'production'

export interface PublicationInput {
  environment: SitePublishEnvironment
  previewBuild?: number
}

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid site publishing request')
  return value as Record<string, unknown>
}

export const publicationInput = (event: unknown): PublicationInput => {
  const data = record(event)
  const input = record(data.client_payload ?? data.inputs)
  if (input.environment !== 'dev' && input.environment !== 'production')
    throw new Error('environment must be dev or production')
  if (input.environment === 'dev') return { environment: 'dev' }
  const value = input.previewBuild
  if (typeof value !== 'number' && typeof value !== 'string')
    throw new Error('A reviewed staging build is required')
  if (typeof value === 'string' && !/^[1-9][0-9]*$/.test(value))
    throw new Error('A reviewed staging build is required')
  const previewBuild = Number(value)
  if (!Number.isSafeInteger(previewBuild) || previewBuild < 1)
    throw new Error('A reviewed staging build is required')
  return { environment: 'production', previewBuild }
}

export interface ReviewedRun {
  id: number
  display_title: string
  status: string | null
  conclusion: string | null
  path: string
  head_branch: string | null
  event: string
}

export const validateReviewedRun = (
  run: Readonly<ReviewedRun>,
  latestPreviewId: number | undefined
): void => {
  if (
    run.id !== latestPreviewId ||
    run.display_title !== `${SITE_PUBLISH_RUN_PREFIX}dev` ||
    run.status !== 'completed' ||
    run.conclusion !== 'success' ||
    run.path !== `.github/workflows/${SITE_PUBLISH_WORKFLOW}` ||
    run.head_branch !== 'develop' ||
    !['repository_dispatch', 'workflow_dispatch'].includes(run.event)
  ) {
    throw new Error(
      'Review the latest successful staging build before publishing live'
    )
  }
}
