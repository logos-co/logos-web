import {
  type Circle,
  type CircleInitiative,
  type CircleResource,
} from '@repo/content/loaders'
import type { CirclesSettings, Language } from '@repo/content/schemas'

import type {
  ActiveCircleMarker,
  ActiveCircleUpcomingEvent,
} from '@/lib/active-circles'

import CirclesMap from './circles-map'
import { CirclesHero } from './_sections/circles-hero'
import { EventsSection } from './_sections/events-section'
import { InitiativesSection } from './_sections/initiatives-section'
import { NearbyCta } from './_sections/nearby-cta'
import { ResourcesSection } from './_sections/resources-section'

type CirclesPageProps = {
  settings: CirclesSettings
  circles: Circle[]
  mapMarkers: ActiveCircleMarker[]
  upcomingEvents: ActiveCircleUpcomingEvent[]
  initiatives: CircleInitiative[]
  resources: CircleResource[]
  locale: Language
}

export default function CirclesPageView({
  settings,
  circles,
  mapMarkers,
  upcomingEvents,
  initiatives,
  resources,
  locale,
}: CirclesPageProps) {
  return (
    <main className="bg-brand-off-white">
      <CirclesHero settings={settings} circles={circles} />
      <CirclesMap settings={settings} markers={mapMarkers} />
      <NearbyCta settings={settings} />
      <EventsSection
        settings={settings}
        events={upcomingEvents}
        locale={locale}
      />
      <InitiativesSection settings={settings} initiatives={initiatives} />
      <ResourcesSection settings={settings} resources={resources} />
    </main>
  )
}
