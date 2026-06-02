import { type CircleResource } from '@repo/content/loaders'
import type { CirclesSettings } from '@repo/content/schemas'

import { CircleResourcesSection } from '@/components/sections/shared/circle-resources-section'

export function ResourcesSection({
  settings,
  resources,
}: {
  settings: CirclesSettings
  resources: CircleResource[]
}) {
  return (
    <CircleResourcesSection
      title={settings.resourcesSection.title}
      description={settings.resourcesSection.description}
      cta={settings.resourcesSection.helpCenterCta}
      resources={resources}
    />
  )
}
