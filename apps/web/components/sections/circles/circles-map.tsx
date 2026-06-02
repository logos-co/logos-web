import type { CirclesSettings } from '@repo/content/schemas'

import { CirclesWorldMap } from '@/components/circles-map'
import type { ActiveCircleMarker } from '@/lib/active-circles'

export default function CirclesMap({
  settings,
  markers,
}: {
  settings: CirclesSettings
  markers: ActiveCircleMarker[]
}) {
  return (
    <section id="map" className="bg-brand-off-white px-3 pb-3 md:pb-12">
      <div className="relative z-0 isolate h-[720px] overflow-hidden rounded-[100px] bg-gray-01 md:h-[675px] md:rounded-[64px]">
        <CirclesWorldMap
          markers={markers}
          center={[settings.map.defaultCenter.lat, settings.map.defaultCenter.lng]}
          zoom={settings.map.defaultZoom}
          zoomInAriaLabel={settings.map.zoomInAriaLabel}
          zoomOutAriaLabel={settings.map.zoomOutAriaLabel}
        />
      </div>
    </section>
  )
}
