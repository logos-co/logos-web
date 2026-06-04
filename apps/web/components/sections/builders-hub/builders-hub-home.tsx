import type {
  BuilderHubHomeIdeaResolution,
  BuilderHubHomeRfpResolution,
} from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'

import { BuildersHubAppInstall } from './builders-hub-app-install'
import { BuildSection } from './_sections/build'
// Temporarily hidden — keep for future reuse.
// import { DocumentationSection } from './_sections/documentation'
import { BuildersHubHero } from './_sections/hero'
import { InspirationSection } from './_sections/inspiration'
import { JourneySection } from './_sections/journey'
import { PrepareSection } from './_sections/prepare'
import { ProgramsSection } from './_sections/programs'
import { SupportSection } from './_sections/support'

type BuildersHubHomeProps = {
  settings: BuilderHubSettings
  rfpResolution: BuilderHubHomeRfpResolution
  ideaResolution: BuilderHubHomeIdeaResolution
}

export function BuildersHubHome({
  settings,
  rfpResolution,
  ideaResolution,
}: BuildersHubHomeProps) {
  return (
    <div className="bg-brand-off-white">
      <BuildersHubHero hero={settings.hero} />
      {settings.journey ? <JourneySection data={settings.journey} /> : null}
      {settings.inspiration ? (
        <InspirationSection
          data={settings.inspiration}
          ideas={ideaResolution.ideas}
        />
      ) : null}
      {settings.prepare ? <PrepareSection data={settings.prepare} /> : null}
      {settings.build ? <BuildSection data={settings.build} /> : null}
      {settings.programs ? (
        <ProgramsSection data={settings.programs} rfps={rfpResolution.rfps} />
      ) : null}
      {settings.support ? <SupportSection data={settings.support} /> : null}
      <BuildersHubAppInstall data={settings.appInstall} />
      {/* Temporarily hidden — keep for future reuse.
      {settings.documentation ? (
        <DocumentationSection data={settings.documentation} />
      ) : null}
      */}
    </div>
  )
}
