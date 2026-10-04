export type PublishEnvironment = 'dev' | 'production'

export const PUBLISH_ENVIRONMENTS = {
  dev: { label: 'dev.logos.co', siteUrl: 'https://dev.logos.co' },
  production: { label: 'logos.co', siteUrl: 'https://logos.co' },
} as const

export const isPublishEnvironment = (
  value: unknown
): value is PublishEnvironment => value === 'dev' || value === 'production'
