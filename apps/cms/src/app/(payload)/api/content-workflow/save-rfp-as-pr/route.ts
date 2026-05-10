import {
  saveRfpAsPullRequest,
  type RfpDocLike,
} from '../../../../../services/content-workflow'
import { createSavePrRoute } from '../save-pr-route'

export const POST = createSavePrRoute<RfpDocLike>({
  collection: 'rfps',
  loadErrorLabel: 'Rfp',
  save: saveRfpAsPullRequest,
})
