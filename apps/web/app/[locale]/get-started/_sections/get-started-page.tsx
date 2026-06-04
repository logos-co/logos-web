import type { BuilderHubSettings } from '@repo/content/schemas'

// import { Build } from './build' // "What you can build today" section hidden — kept for future use
import { Community } from './community'
import { Docs } from './docs'
import { Hero } from './hero'
import { Install } from './install'
import type { GetStartedTranslator } from './types'

export function GetStartedPage({
  t,
  basecampInstall,
}: {
  t: GetStartedTranslator
  basecampInstall: NonNullable<BuilderHubSettings['prepare']>
}) {
  return (
    <div className="bg-brand-off-white text-brand-dark-green">
      <Hero heading={t('heading')} intro={t('intro')} />
      <Install t={t} data={basecampInstall} />
      <Docs t={t} />
      <Community t={t} />
      {/* "What you can build today" section hidden — component kept for future use */}
      {/* <Build t={t} /> */}
    </div>
  )
}
