import {
  saveIdeaAsPullRequest,
  type IdeaDocLike,
} from '../../../../../services/content-workflow'
import { createSavePrRoute } from '../save-pr-route'

export const POST = createSavePrRoute<IdeaDocLike>({
  collection: 'ideas',
  loadErrorLabel: 'Idea',
  save: saveIdeaAsPullRequest,
})
