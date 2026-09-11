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
 * `text-small-compact` keeps small text on Figma's 10px so lines break as in
 * the frame.
 */
export function FieldStationPage() {
  return (
    <div className="text-small-compact overflow-hidden bg-brand-off-white pb-28">
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
        // Figma trims the title and body to their cap height, and draws the
        // Install border inside its 8px padding, so the button is 31px tall.
        switchClassName="[&_.giant-switch\_\_content_p]:[text-box-edge:cap_alphabetic] [&_.giant-switch\_\_content_p]:[text-box-trim:trim-both] [&_[data-giant-switch-install-trigger]_a]:py-[7px]"
      />
      <Faq />
      <Partners />
    </div>
  )
}
