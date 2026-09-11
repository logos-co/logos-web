import TechOverviewLogosApp from '@/components/sections/technology-stack/tech-overview-logos-app'

import { APPLY_BANNER, EVENT_NAMES } from '../_content'
import { About } from './about'
import { Agenda } from './agenda'
import { Application } from './application'
import { Faq } from './faq'
import { Gathering } from './gathering'
import { Hero } from './hero'
import { Partners } from './partners'
import { Timeline } from './timeline'
import { Tracks } from './tracks'
import { Venue } from './venue'

/**
 * Figma stacks the sections 112px apart; the venue block sits 80px from its
 * neighbours. The last section keeps the same 112px above the footer.
 */
export function FieldStationPage() {
  return (
    <div className="overflow-hidden bg-brand-off-white pb-28">
      <Hero />
      <About />
      <Tracks />
      <Application />
      <Timeline />
      <Venue />
      <Gathering />
      <Agenda />
      <TechOverviewLogosApp
        data={APPLY_BANNER}
        className="mt-28"
        eventNames={{ primary: EVENT_NAMES.applyBannerInstall }}
      />
      <Faq />
      <Partners />
    </div>
  )
}
