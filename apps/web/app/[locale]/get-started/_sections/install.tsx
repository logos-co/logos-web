import type { BuilderHubSettings, GetStartedCopySection } from '@repo/content/schemas'

import { BasecampInstallSection } from '@/components/sections/shared/basecamp-install-section'

export function Install({
  labels,
  data,
}: {
  labels: GetStartedCopySection['sections']['install']
  data: NonNullable<BuilderHubSettings['prepare']>
}) {
  return (
    <BasecampInstallSection
      id="install"
      index={labels.number}
      title={labels.heading}
      cards={data.cards}
    />
  )
}
