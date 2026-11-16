import type { ProgrammeCards } from '@/lib/programme-cards'
import type { BuilderHubSettings } from '@repo/content/schemas'

import { DeveloperProgramsSection } from '@/components/sections/shared/developer-programs-section'

export function Programs({
  data,
  programmeCards,
}: {
  data: NonNullable<BuilderHubSettings['programs']>
  programmeCards: ProgrammeCards
}) {
  return (
    <DeveloperProgramsSection
      id="developer-programs"
      index="03"
      title={data.title}
      data={data}
      programmeCards={programmeCards}
      eventNames={{ prize: 'Lambda Prize', rfps: 'Explore RFPs' }}
    />
  )
}
