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
  locale,
}: {
  t: Translate
  circlesSettings: CirclesSettings
  mapMarkers: ActiveCircleMarker[]
  upcomingEvents: ActiveCircleUpcomingEvent[]
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
      <div className="md:hidden">
        <CirclesMap settings={circlesSettings} markers={mapMarkers} />
      </div>
      <div className="hidden md:block">{findCta}</div>
      <div className="hidden md:block">
        <CirclesMap settings={circlesSettings} markers={mapMarkers} />
      </div>
      <div className="md:hidden">{findCta}</div>
      <ActivismSection t={t} />
      <EventsSection
        settings={circlesSettings}
        events={upcomingEvents}
        locale={locale}
      />
      <GetInvolvedSection t={t} />
      <BuilderSection t={t} />
      <ResourcesSection t={t} />
    </>
  )
}
