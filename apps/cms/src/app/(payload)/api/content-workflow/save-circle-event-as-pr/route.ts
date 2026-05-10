import {
  saveCircleEventAsPullRequest,
  type CircleEventDocLike,
} from '../../../../../services/content-workflow'
import { createSavePrRoute } from '../save-pr-route'

export const POST = createSavePrRoute<CircleEventDocLike>({
  collection: 'circle-events',
  loadErrorLabel: 'CircleEvent',
  save: saveCircleEventAsPullRequest,
})
