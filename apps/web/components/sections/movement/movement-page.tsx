import {
  type CircleInitiative,
  type CircleResource,
} from '@repo/content/loaders'
import type {
  CirclesSettings,
  Language,
  MovementCopySection,
} from '@repo/content/schemas'

import CirclesMap from '@/components/sections/circles/circles-map'
import type {
  ActiveCircleMarker,
  ActiveCircleUpcomingEvent,
} from '@/lib/active-circles'

import { ActionCardsSection } from './_sections/action-cards'
import { ActivismSection } from './_sections/activism'
import { CenterCtaSection } from './_sections/atoms'
import { BuilderSection } from './_sections/builder'
import { CampaignSection } from './_sections/campaign'
import { EventsSection } from './_sections/events'
import { GetInvolvedSection } from './_sections/get-involved'
import { HeroSection } from './_sections/hero'
import { ResourcesSection } from './_sections/resources'

export function MovementPageView({
  data,
  circlesSettings,
  mapMarkers,
  upcomingEvents,
  initiatives,
  resources,
  locale,
}: {
  data: MovementCopySection
  circlesSettings: CirclesSettings
  mapMarkers: ActiveCircleMarker[]
  upcomingEvents: ActiveCircleUpcomingEvent[]
  initiatives: CircleInitiative[]
  resources: CircleResource[]
  locale: Language
}) {
  const findCta = (
    <CenterCtaSection
      title={data.find.title}
      body={data.find.body}
      className="pb-19"
    />
  )

  return (
    <>
      <HeroSection data={data} />
      <ActionCardsSection data={data} />
      <CampaignSection data={data} />
      <div className="flex flex-col">
        <div>{findCta}</div>
        <div id="circles-map">
          <CirclesMap
            settings={circlesSettings}
            markers={mapMarkers}
            upcomingEvents={upcomingEvents}
            locale={locale}
          />
        </div>
      </div>
      <ActivismSection data={data} initiatives={initiatives} />
      <EventsSection
        settings={circlesSettings}
        events={upcomingEvents}
        locale={locale}
      />
      <GetInvolvedSection data={data} />
      <BuilderSection data={data} />
      <ResourcesSection settings={circlesSettings} resources={resources} />
    </>
  )
}
