/**
 * The two sites the publish workflow can build, and how a workflow run is
 * matched back to one of them: the workflow sets its run name to
 * `publish-<environment>`.
 */
export type PublishEnvironment = 'dev' | 'production'

export interface PublishEnvironmentConfig {
  /** Branch the workflow builds from. */
  branch: string
  label: string
  runName: string
  siteUrl: string
}

export const PUBLISH_WORKFLOW_FILE = 'publish-site.yml'
export const PUBLISH_DISPATCH_TYPE = 'publish-site'

export const PUBLISH_ENVIRONMENTS: Record<
  PublishEnvironment,
  PublishEnvironmentConfig
> = {
  dev: {
    branch: 'develop',
    label: 'dev.logos.co',
    runName: 'publish-dev',
    siteUrl: 'https://dev.logos.co',
  },
  production: {
    branch: 'master',
    label: 'logos.co',
    runName: 'publish-production',
    siteUrl: 'https://logos.co',
  },
}

export const PUBLISH_ENVIRONMENT_ORDER: PublishEnvironment[] = [
  'dev',
  'production',
]

export const isPublishEnvironment = (
  value: unknown
): value is PublishEnvironment => value === 'dev' || value === 'production'

export const environmentForRunName = (
  runName: string | null | undefined
): PublishEnvironment | null =>
  PUBLISH_ENVIRONMENT_ORDER.find(
    (environment) => PUBLISH_ENVIRONMENTS[environment].runName === runName
  ) ?? null
