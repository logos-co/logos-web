import type { BuilderHubHomeRfpResolution } from '@repo/content/loaders'
import type { BuilderHubSettings, GetStartedCopySection } from '@repo/content/schemas'

// import { Build } from './build' // "What you can build today" section hidden — kept for future use
import { Community } from './community'
import { Docs } from './docs'
import { Hero } from './hero'
import { Install } from './install'
import { Programs } from './programs'

export function GetStartedPage({
  data,
  basecampInstall,
  developerPrograms,
  rfps,
}: {
  data: GetStartedCopySection
  basecampInstall: NonNullable<BuilderHubSettings['prepare']>
  developerPrograms: NonNullable<BuilderHubSettings['programs']>
  rfps: BuilderHubHomeRfpResolution['rfps']
}) {
  return (
    <div className="bg-brand-off-white text-brand-dark-green">
      <Hero heading={data.heading} intro={data.intro} />
      <Install labels={data.sections.install} data={basecampInstall} />
      <Docs data={data.sections.docs} />
      <Programs data={developerPrograms} rfps={rfps} />
      <Community data={data.sections.community} />
      {/* "What you can build today" section hidden — component kept for future use */}
      {/* <Build data={data.sections.build} /> */}
    </div>
  )
}
