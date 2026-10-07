import { getGithubPublishClient } from './github'
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

const loadGithubStatus = createLoadPublishStatus({
  listRuns: (environment) => getGithubPublishClient().listRuns(environment),
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
  loadGithubStatus,
  reservations
)
export const triggerPublish = createTriggerPublish({
  dispatch: (environment, previewBuild) =>
    getGithubPublishClient().dispatch(environment, previewBuild),
  loadStatus: loadGithubStatus,
  reservations,
})
