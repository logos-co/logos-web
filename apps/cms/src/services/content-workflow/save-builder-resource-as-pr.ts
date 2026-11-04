import { resourceSaver, type ResourceDoc } from './resource-list'

export type BuilderResourceDocLike = ResourceDoc & { id: string | number }
export const saveBuilderResourceAsPullRequest = resourceSaver(
  'builder-resource',
  'upsert'
)
export const deleteBuilderResourceAsPullRequest = resourceSaver(
  'builder-resource',
  'delete'
)
