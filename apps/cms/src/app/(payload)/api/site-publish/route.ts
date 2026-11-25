import { getPayload } from 'payload'

import { recordProductionPublish } from '@/services/content-workflow/record-release'

import { loadPublishStatus, triggerPublish } from '@/services/site-publish'
import { createSitePublishHandlers } from '@/services/site-publish/handlers'

const loadPayload = async () => {
  const { default: config } = await import('@payload-config')
  return getPayload({ config })
}

const handlers = createSitePublishHandlers({
  authenticate: async (headers) => {
    const { user } = await (await loadPayload()).auth({ headers })
    return user ? { id: Number(user.id) } : null
  },
  loadPublishStatus,
  recordProductionPublish: async (userId) =>
    recordProductionPublish({ payload: await loadPayload(), userId }),
  triggerPublish,
})

export const GET = handlers.GET
export const POST = handlers.POST
