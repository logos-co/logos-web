import type { BuilderHubHomeRfpResolution } from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'

import { DeveloperProgramsSection } from '@/components/sections/shared/developer-programs-section'

export function Programs({
  data,
  rfps,
}: {
  data: NonNullable<BuilderHubSettings['programs']>
  rfps: BuilderHubHomeRfpResolution['rfps']
}) {
  return (
    <DeveloperProgramsSection
      id="developer-programs"
      index="03"
      title={data.title}
      data={data}
      rfps={rfps}
    />
  )
}
