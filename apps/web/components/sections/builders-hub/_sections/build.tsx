import type { BuilderHubSettings } from '@repo/content/schemas'

import { StartBuildingCardGrid } from '@/components/sections/shared/start-building-card-grid'

import { SectionFrame } from './atoms'

export function BuildSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['build']>
}) {
  return (
    <SectionFrame id="start-building" index="03" title={data.title}>
      <StartBuildingCardGrid cards={data.cards} />
    </SectionFrame>
  )
}
