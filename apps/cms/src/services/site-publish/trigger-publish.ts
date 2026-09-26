import { PUBLISH_ENVIRONMENTS, type PublishEnvironment } from './environments'
import type { PublishStatusResult } from './load-publish-status'

/** The environment cannot be published right now, and why. */
export class PublishBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublishBlockedError'
  }
}

export interface TriggerPublishDependencies {
  clearStatusCache: () => void
  dispatch: (environment: PublishEnvironment) => Promise<void>
  loadStatus: () => Promise<PublishStatusResult>
}

export interface TriggerPublishResult {
  environment: PublishEnvironment
  label: string
}

/**
 * Starts a publish, but only when the panel's rules allow it: the button can
 * be worked around, the server rule cannot.
 */
export const createTriggerPublish =
  ({ clearStatusCache, dispatch, loadStatus }: TriggerPublishDependencies) =>
  async (environment: PublishEnvironment): Promise<TriggerPublishResult> => {
    const { status } = await loadStatus()
    const environmentStatus = status[environment]
    if (!environmentStatus.canPublish) {
      throw new PublishBlockedError(
        environmentStatus.blockedReason ?? 'This site cannot be published now.'
      )
    }

    await dispatch(environment)
    clearStatusCache()

    return { environment, label: PUBLISH_ENVIRONMENTS[environment].label }
  }
