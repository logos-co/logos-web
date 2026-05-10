import {
  saveCircleInitiativeAsPullRequest,
  type CircleInitiativeDocLike,
} from '../../../../../services/content-workflow'
import { createSavePrRoute } from '../save-pr-route'

export const POST = createSavePrRoute<CircleInitiativeDocLike>({
  collection: 'circle-initiatives',
  loadErrorLabel: 'CircleInitiative',
  save: saveCircleInitiativeAsPullRequest,
})
