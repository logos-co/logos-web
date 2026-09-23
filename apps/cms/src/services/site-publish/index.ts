import {
  dispatchPublish,
  listPublicPublishRuns,
  listPublishRuns,
} from './github-runs'
import {
  clearPublishStatusCache,
  createLoadPublishStatus,
} from './load-publish-status'
import { createTriggerPublish } from './trigger-publish'

export {
  isPublishEnvironment,
  PUBLISH_ENVIRONMENTS,
  PUBLISH_ENVIRONMENT_ORDER,
  type PublishEnvironment,
} from './environments'
export type {
  PublishEnvironmentStatus,
  PublishRun,
  PublishStatus,
} from './publish-status'
export type { PublishStatusResult } from './load-publish-status'
export { PublishBlockedError } from './trigger-publish'

/** What the publish panel shows: the last run of each site and what is allowed. */
export const loadPublishStatus = createLoadPublishStatus({
  listPublicRuns: listPublicPublishRuns,
  listRuns: listPublishRuns,
})

/** Starts a publish of one site, when its rules allow it. */
export const triggerPublish = createTriggerPublish({
  clearStatusCache: clearPublishStatusCache,
  dispatch: dispatchPublish,
  loadStatus: loadPublishStatus,
})
