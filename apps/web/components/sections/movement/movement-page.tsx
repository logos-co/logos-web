import {
  type CircleInitiative,
  type CircleResource,
} from '@repo/content/loaders'
import type { CirclesSettings, Language } from '@repo/content/schemas'

import CirclesMap from '@/components/sections/circles/circles-map'
import { ROUTES } from '@/constants/routes'
import type {
  ActiveCircleMarker,
  ActiveCircleUpcomingEvent,
} from '@/lib/active-circles'

import { ActionCardsSection } from './_sections/action-cards'
import { ActivismSection } from './_sections/activism'
import { CenterCtaSection, Cta } from './_sections/atoms'
import { BuilderSection } from './_sections/builder'
import { CampaignSection } from './_sections/campaign'
import { EventsSection } from './_sections/events'
import { GetInvolvedSection } from './_sections/get-involved'
import { HeroSection } from './_sections/hero'
import { ResourcesSection } from './_sections/resources'
import type { Translate } from './_sections/types'

export function MovementPageView({
  t,
  circlesSettings,
  mapMarkers,
  upcomingEvents,
  initiatives,
  resources,
  locale,
}: {
  t: Translate
  circlesSettings: CirclesSettings
  mapMarkers: ActiveCircleMarker[]
  upcomingEvents: ActiveCircleUpcomingEvent[]
  initiatives: CircleInitiative[]
  resources: CircleResource[]
  locale: Language
}) {
  const findCta = (
    <CenterCtaSection
      title={t('find.title')}
      body={t('find.body')}
      cta={<Cta href={ROUTES.circles} label={t('find.cta')} />}
    />
  )

  return (
    <>
      <HeroSection t={t} />
      <ActionCardsSection t={t} />
      <CampaignSection t={t} />
      <div className="flex flex-col">
        <div className="order-2 md:order-1">{findCta}</div>
        <div id="circles-map" className="order-1 md:order-2">
          <CirclesMap settings={circlesSettings} markers={mapMarkers} />
        </div>
      </div>
      <ActivismSection t={t} initiatives={initiatives} />
      <EventsSection
        settings={circlesSettings}
        events={upcomingEvents}
        locale={locale}
      />
      <GetInvolvedSection t={t} />
      <BuilderSection t={t} />
      <ResourcesSection settings={circlesSettings} resources={resources} />
    </>
  )
}
