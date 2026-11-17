import type { ProgrammeCards } from '@/lib/programme-cards'
import type { BuilderHubSettings } from '@repo/content/schemas'

import { DeveloperProgramsSection } from '@/components/sections/shared/developer-programs-section'

export function ProgramsSection({
  data,
  programmeCards,
}: {
  data: NonNullable<BuilderHubSettings['programs']>
  programmeCards: ProgrammeCards
}) {
  return (
    <DeveloperProgramsSection
      id="builder-programs"
      index="04"
      title={data.title}
      data={data}
      programmeCards={programmeCards}
    />
  )
}
