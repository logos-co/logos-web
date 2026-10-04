import { PUBLISH_ENVIRONMENTS, type PublishEnvironment } from './environments'
import type { PublishStatusResult } from './load-publish-status'
import { DispatchUncertainError } from './dispatch-error'
import {
  withPublishReservation,
  type PublishReservations,
} from './reservations'

export class PublishBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublishBlockedError'
  }
}

export interface TriggerPublishDependencies {
  dispatch: (
    environment: PublishEnvironment,
    previewBuild?: number
  ) => Promise<void>
  loadStatus: () => Promise<PublishStatusResult>
  reservations: PublishReservations
}

export const createTriggerPublish = ({
  dispatch,
  loadStatus,
  reservations,
}: TriggerPublishDependencies): ((
  environment: PublishEnvironment,
  previewBuild?: number
) => Promise<{ environment: PublishEnvironment; label: string }>) => {
  return async (environment, previewBuild) => {
    const initial = await withPublishReservation(loadStatus, reservations)()
    if (!initial.status[environment].canPublish) {
      throw new PublishBlockedError(
        initial.status[environment].blockedReason ??
          'This site cannot be published now.'
      )
    }
    const latest = initial.status[environment].latestRun
    const reservation = await reservations.acquire(
      environment,
      latest && latest.id > 0 ? latest.id : 0
    )
    if (!reservation)
      throw new PublishBlockedError(
        'A build request is already awaiting confirmation from Jenkins.'
      )
    try {
      const { status } = await loadStatus()
      if (status[environment].latestRun?.id !== latest?.id) {
        throw new PublishBlockedError(
          'The Jenkins build history changed. Refresh before submitting a build.'
        )
      }
      if (!status[environment].canPublish) {
        throw new PublishBlockedError(
          status[environment].blockedReason ??
            'This site cannot be published now.'
        )
      }
      if (
        environment === 'production' &&
        (!Number.isSafeInteger(previewBuild) ||
          previewBuild !== status.dev.latestRun?.id)
      ) {
        throw new PublishBlockedError(
          'The staging preview has changed. Review the latest build before publishing live.'
        )
      }
      await dispatch(
        environment,
        environment === 'production' ? previewBuild : undefined
      )
      return { environment, label: PUBLISH_ENVIRONMENTS[environment].label }
    } catch (error) {
      if (!(error instanceof DispatchUncertainError)) {
        await reservations.release(reservation.token)
      }
      throw error
    }
  }
}
