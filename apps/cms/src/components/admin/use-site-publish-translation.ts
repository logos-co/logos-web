import { useTranslation } from '@payloadcms/ui'
import type messages from '@/messages/site-publish.en.json'

export const useSitePublishTranslation = () =>
  useTranslation<
    { sitePublish: typeof messages },
    `sitePublish:${keyof typeof messages}`
  >()
