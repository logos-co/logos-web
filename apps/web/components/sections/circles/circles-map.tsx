import type { CirclesSettings, Language } from '@repo/content/schemas'

import { CirclesMapAttribution } from '@/components/circles-map/circles-map-attribution'
import ContentWidth from '@/components/layout/content-width'
import { CirclesWorldMap } from '@/components/circles-map'
import type { ActiveCircleMarker, ActiveCircleUpcomingEvent } from '@/lib/active-circles'

export default function CirclesMap({
  settings,
  markers,
  upcomingEvents,
  locale,
}: {
  settings: CirclesSettings
  markers: ActiveCircleMarker[]
  upcomingEvents?: ActiveCircleUpcomingEvent[]
  locale?: Language
}) {
  return (
    <section id="map" className="bg-brand-off-white pb-3 md:pb-12">
      <ContentWidth className="py-0">
        <div className="relative z-0 isolate h-[720px] overflow-hidden rounded-[100px] bg-gray-01 md:h-[675px] md:rounded-[64px]">
          <CirclesWorldMap
            markers={markers}
            upcomingEvents={upcomingEvents}
            locale={locale}
            center={[settings.map.defaultCenter.lat, settings.map.defaultCenter.lng]}
            zoom={settings.map.defaultZoom}
            zoomInAriaLabel={settings.map.zoomInAriaLabel}
            zoomOutAriaLabel={settings.map.zoomOutAriaLabel}
            gestureHintLabel={settings.map.gestureHintLabel}
          />
        </div>
        <CirclesMapAttribution attribution={settings.map.attribution} />
      </ContentWidth>
    </section>
  )
}
