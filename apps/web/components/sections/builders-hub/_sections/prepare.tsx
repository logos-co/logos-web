import type { BuilderHubSettings } from '@repo/content/schemas'

import { BasecampInstallSection } from '@/components/sections/shared/basecamp-install-section'

export function PrepareSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['prepare']>
}) {
  return (
    <BasecampInstallSection
      id="prepare"
      index="02"
      title={data.title}
      cards={data.cards}
    />
  )
}
