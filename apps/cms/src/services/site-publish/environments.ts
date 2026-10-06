export type PublishEnvironment = 'dev' | 'production'

export const PUBLISH_ENVIRONMENTS = {
  dev: { label: 'dev.logos.co', siteUrl: 'https://dev.logos.co' },
  production: { label: 'logos.co', siteUrl: 'https://logos.co' },
} as const

export const JENKINS_JOBS: Record<PublishEnvironment, string> = {
  dev: 'https://ci.infra.status.im/job/website/job/dev.logos.co/',
  production: 'https://ci.infra.status.im/job/website/job/logos.co/',
}

export const isPublishEnvironment = (
  value: unknown
): value is PublishEnvironment => value === 'dev' || value === 'production'
