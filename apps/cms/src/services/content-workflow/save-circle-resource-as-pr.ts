import { resourceSaver, type ResourceDoc } from './resource-list'

export type CircleResourceDocLike = ResourceDoc & { id: string | number }
export const saveCircleResourceAsPullRequest = resourceSaver(
  'circle-resource',
  'upsert'
)
export const deleteCircleResourceAsPullRequest = resourceSaver(
  'circle-resource',
  'delete'
)
