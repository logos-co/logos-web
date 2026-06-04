import type { BuilderHubHomeRfpResolution } from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'

// import { Build } from './build' // "What you can build today" section hidden — kept for future use
import { Community } from './community'
import { Docs } from './docs'
import { Hero } from './hero'
import { Install } from './install'
import { Programs } from './programs'
import type { GetStartedTranslator } from './types'

export function GetStartedPage({
  t,
  basecampInstall,
  developerPrograms,
  rfps,
}: {
  t: GetStartedTranslator
  basecampInstall: NonNullable<BuilderHubSettings['prepare']>
  developerPrograms: NonNullable<BuilderHubSettings['programs']>
  rfps: BuilderHubHomeRfpResolution['rfps']
}) {
  return (
    <div className="bg-brand-off-white text-brand-dark-green">
      <Hero heading={t('heading')} intro={t('intro')} />
      <Install t={t} data={basecampInstall} />
      <Docs t={t} />
      <Programs data={developerPrograms} rfps={rfps} />
      <Community t={t} />
      {/* "What you can build today" section hidden — component kept for future use */}
      {/* <Build t={t} /> */}
    </div>
  )
}
