import { getJenkinsClient } from './jenkins'
import { createLoadPublishStatus } from './load-publish-status'
import { createTriggerPublish } from './trigger-publish'
import { getPayload } from 'payload'
import {
  createPublishReservations,
  withPublishReservation,
  type PublishReservations,
} from './reservations'

export { isPublishEnvironment } from './environments'
export { PublishBlockedError } from './trigger-publish'

const loadJenkinsStatus = createLoadPublishStatus({
  listRuns: (environment) => getJenkinsClient().listRuns(environment),
})
const getReservations = async (): Promise<PublishReservations> => {
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  return createPublishReservations(payload.db)
}
const reservations: PublishReservations = {
  acquire: async (...args) => (await getReservations()).acquire(...args),
  read: async () => (await getReservations()).read(),
  release: async (token) => (await getReservations()).release(token),
}
export const loadPublishStatus = withPublishReservation(
  loadJenkinsStatus,
  reservations
)
export const triggerPublish = createTriggerPublish({
  dispatch: (environment, previewBuild) =>
    getJenkinsClient().dispatch(environment, previewBuild),
  loadStatus: loadJenkinsStatus,
  reservations,
})
