import {
  environmentForRunName,
  PUBLISH_ENVIRONMENTS,
  type PublishEnvironment,
} from './environments'

/** The fields this service uses from a Github Actions workflow run. */
export interface WorkflowRun {
  conclusion: string | null
  display_title?: string | null
  html_url: string
  id: number
  name?: string | null
  run_started_at?: string | null
  status: string | null
  updated_at: string
}

export type PublishRunState = 'queued' | 'running' | 'finished'

export interface PublishRun {
  conclusion: string | null
  finishedAt: string | null
  id: number
  runUrl: string
  startedAt: string | null
  state: PublishRunState
  succeeded: boolean
}

export interface PublishEnvironmentStatus {
  blockedReason?: string
  canPublish: boolean
  /** How long the last good publish took, for the progress bar. */
  estimatedDurationMs: number | null
  label: string
  latestRun: PublishRun | null
  siteUrl: string
}

export type PublishStatus = Record<PublishEnvironment, PublishEnvironmentStatus>

const toRunState = (status: string | null): PublishRunState => {
  if (status === 'completed') return 'finished'
  return status === 'queued' || status === 'pending' || status === 'waiting'
    ? 'queued'
    : 'running'
}

const toPublishRun = (run: WorkflowRun): PublishRun => {
  const state = toRunState(run.status)
  return {
    conclusion: run.conclusion,
    finishedAt: state === 'finished' ? run.updated_at : null,
    id: run.id,
    runUrl: run.html_url,
    startedAt: run.run_started_at ?? null,
    state,
    succeeded: state === 'finished' && run.conclusion === 'success',
  }
}

const durationMs = (run: WorkflowRun): number | null => {
  if (!run.run_started_at) return null
  const started = Date.parse(run.run_started_at)
  const finished = Date.parse(run.updated_at)
  if (Number.isNaN(started) || Number.isNaN(finished)) return null
  return finished > started ? finished - started : null
}

const runsForEnvironment = (
  runs: readonly WorkflowRun[],
  environment: PublishEnvironment
): WorkflowRun[] =>
  runs
    .filter(
      (run) =>
        environmentForRunName(run.display_title ?? run.name) === environment
    )
    .sort((left, right) => right.id - left.id)

const inFlight = (run: PublishRun | null): boolean =>
  run !== null && run.state !== 'finished'

/**
 * Why production cannot be published right now, or undefined when it can.
 * Production only follows a dev publish that finished well, so whatever goes
 * live has been seen on dev first.
 */
const productionBlockedReason = (
  dev: PublishRun | null,
  production: PublishRun | null
): string | undefined => {
  if (inFlight(production)) return 'A production publish is already running.'
  if (!dev) return 'Publish to dev first, so the change can be checked there.'
  if (inFlight(dev)) return 'Wait for the dev publish to finish.'
  if (!dev.succeeded) {
    return 'The last dev publish failed, so there is nothing checked to promote.'
  }
  return undefined
}

const buildEnvironmentStatus = (
  environment: PublishEnvironment,
  runs: readonly WorkflowRun[],
  blockedReason: string | undefined
): PublishEnvironmentStatus => {
  const environmentRuns = runsForEnvironment(runs, environment)
  const latest = environmentRuns[0]
  const lastGood = environmentRuns.find(
    (run) => run.status === 'completed' && run.conclusion === 'success'
  )
  const config = PUBLISH_ENVIRONMENTS[environment]

  return {
    ...(blockedReason ? { blockedReason } : {}),
    canPublish: !blockedReason,
    estimatedDurationMs: lastGood ? durationMs(lastGood) : null,
    label: config.label,
    latestRun: latest ? toPublishRun(latest) : null,
    siteUrl: config.siteUrl,
  }
}

/** Turns the recent workflow runs into what the publish panel shows. */
export const buildPublishStatus = (
  runs: readonly WorkflowRun[]
): PublishStatus => {
  const devRun = runsForEnvironment(runs, 'dev')[0]
  const productionRun = runsForEnvironment(runs, 'production')[0]
  const dev = devRun ? toPublishRun(devRun) : null
  const production = productionRun ? toPublishRun(productionRun) : null

  return {
    dev: buildEnvironmentStatus(
      'dev',
      runs,
      inFlight(dev) ? 'A dev publish is already running.' : undefined
    ),
    production: buildEnvironmentStatus(
      'production',
      runs,
      productionBlockedReason(dev, production)
    ),
  }
}
