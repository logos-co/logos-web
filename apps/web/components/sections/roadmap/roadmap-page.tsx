import type { RoadmapCopySection } from '@repo/content/schemas'

import { RoadmapFaqs } from './faqs'
import { RoadmapHero } from './hero'
import { RoadmapOverview } from './overview'
import { RoadmapRelease } from './release'

interface RoadmapPageProps {
  data: RoadmapCopySection
}

export default function RoadmapPage({ data }: RoadmapPageProps) {
  return (
    <>
      <RoadmapHero data={data.hero} />
      <RoadmapRelease data={data.release} />
      <RoadmapOverview data={data.overview} />
      <RoadmapFaqs data={data.faqs} />
    </>
  )
}
