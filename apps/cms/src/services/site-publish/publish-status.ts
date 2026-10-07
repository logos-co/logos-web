import { PUBLISH_ENVIRONMENTS, type PublishEnvironment } from './environments'

export interface PublishRun {
  conclusion: string | null
  finishedAt: string | null
  hasSnapshot: boolean
  id: number
  runUrl: string
  startedAt: string | null
  state: 'queued' | 'running' | 'finished'
  succeeded: boolean
}

export interface PublishEnvironmentStatus {
  blockedReason?: string
  blockedReasonKey?:
    | 'buildBusy'
    | 'previewRequired'
    | 'snapshotRequired'
    | 'requestPending'
  canPublish: boolean
  estimatedDurationMs: number | null
  label: string
  latestRun: PublishRun | null
  siteUrl: string
}

export type PublishStatus = Record<PublishEnvironment, PublishEnvironmentStatus>
export type PublishRuns = Record<PublishEnvironment, readonly PublishRun[]>

export const buildPublishStatus = (runs: PublishRuns): PublishStatus => {
  const active = Object.values(runs).some((items) =>
    items.some((run) => run.state !== 'finished')
  )
  const dev = runs.dev[0]
  const blocked = active
    ? 'A site build is queued or running. Wait for it to finish.'
    : undefined
  const productionBlocked =
    blocked ??
    (!dev?.succeeded
      ? 'Build the staging preview successfully before publishing live.'
      : !dev.hasSnapshot
        ? 'Build a new staging preview to capture the article content.'
        : undefined)
  const statusFor = (
    environment: PublishEnvironment,
    blockedReason?: string,
    blockedReasonKey?: PublishEnvironmentStatus['blockedReasonKey']
  ): PublishEnvironmentStatus => {
    const good = runs[environment].find((run) => run.succeeded)
    return {
      ...PUBLISH_ENVIRONMENTS[environment],
      canPublish: !blockedReason,
      ...(blockedReason ? { blockedReason, blockedReasonKey } : {}),
      latestRun: runs[environment][0] ?? null,
      estimatedDurationMs:
        good?.startedAt && good.finishedAt
          ? Date.parse(good.finishedAt) - Date.parse(good.startedAt)
          : null,
    }
  }
  return {
    dev: statusFor('dev', blocked, blocked ? 'buildBusy' : undefined),
    production: statusFor(
      'production',
      productionBlocked,
      blocked
        ? 'buildBusy'
        : !dev?.succeeded
          ? 'previewRequired'
          : !dev.hasSnapshot
            ? 'snapshotRequired'
            : undefined
    ),
  }
}
