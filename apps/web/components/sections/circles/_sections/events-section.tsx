import type { CirclesSettings, Language } from '@repo/content/schemas'

import { UpcomingEventsSection } from '@/components/sections/shared/upcoming-events-section'
import type { ActiveCircleUpcomingEvent } from '@/lib/active-circles'

export function EventsSection({
  settings,
  events,
  locale,
}: {
  settings: CirclesSettings
  events: ActiveCircleUpcomingEvent[]
  locale: Language
}) {
  return (
    <UpcomingEventsSection
      title={settings.eventsSection.title}
      description={settings.eventsSection.description}
      cta={settings.eventsSection.calendarCta}
      events={events}
      locale={locale}
    />
  )
}
