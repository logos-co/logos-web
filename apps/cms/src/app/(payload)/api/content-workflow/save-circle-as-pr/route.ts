import {
  saveCircleAsPullRequest,
  type CircleDocLike,
} from '../../../../../services/content-workflow'
import { createSavePrRoute } from '../save-pr-route'

export const POST = createSavePrRoute<CircleDocLike>({
  collection: 'circles',
  loadErrorLabel: 'Circle',
  save: saveCircleAsPullRequest,
})
