import { getPayload } from 'payload'

import { loadPublishStatus, triggerPublish } from '@/services/site-publish'
import { createSitePublishHandlers } from '@/services/site-publish/handlers'

const handlers = createSitePublishHandlers({
  authenticate: async (headers) => {
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers })
    return Boolean(user)
  },
  loadPublishStatus,
  triggerPublish,
})

export const GET = handlers.GET
export const POST = handlers.POST
