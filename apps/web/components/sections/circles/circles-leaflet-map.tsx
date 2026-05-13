'use client'

import {
  AttributionControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { Circle } from '@repo/content/loaders'
import type { CirclesSettings } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

const ARCGIS_LIGHT_GRAY_TILES =
  'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'

const yellowMarkerIcon = L.divIcon({
  className: 'logos-circle-marker',
  iconSize: [23, 23],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:9999px;background-color:#ffd328;box-shadow:0 1px 6px rgba(0,0,0,0.18);">
      <span aria-hidden="true" style="display:block;width:9px;height:12px;background-color:#152521;mask:url(/icons/logos-mark.svg) center / contain no-repeat;-webkit-mask:url(/icons/logos-mark.svg) center / contain no-repeat;"></span>
    </div>
  `,
})

function ZoomControls({
  zoomInAriaLabel,
  zoomOutAriaLabel,
}: {
  zoomInAriaLabel: string
  zoomOutAriaLabel: string
}) {
  const map = useMap()

  return (
    <div className="pointer-events-auto absolute top-[47px] right-[33px] z-[400] flex flex-col gap-3 md:top-6 md:right-6 md:flex-row">
      <button
        type="button"
        aria-label={zoomOutAriaLabel}
        onClick={() => map.zoomOut()}
        className="order-2 flex h-[66px] w-[72px] cursor-pointer items-center justify-center rounded-full bg-brand-dark-green text-brand-off-white transition-opacity hover:opacity-80 md:order-1 md:size-10"
      >
        -
      </button>
      <button
        type="button"
        aria-label={zoomInAriaLabel}
        onClick={() => map.zoomIn()}
        className="order-1 flex h-[66px] w-[72px] cursor-pointer items-center justify-center rounded-full bg-brand-dark-green text-brand-off-white transition-opacity hover:opacity-80 md:order-2 md:size-10"
      >
        +
      </button>
    </div>
  )
}

export default function CirclesLeafletMap({
  settings,
  circles,
}: {
  settings: CirclesSettings
  circles: Circle[]
}) {
  const center: [number, number] = [
    settings.map.defaultCenter.lat,
    settings.map.defaultCenter.lng,
  ]

  return (
    <section id="map" className="bg-brand-off-white px-3 pb-3 md:pb-12">
      <div className="relative mx-auto h-[720px] max-w-[369px] overflow-hidden rounded-[100px] bg-gray-01 md:h-[675px] md:max-w-[1416px] md:rounded-[64px]">
        <MapContainer
          center={center}
          zoom={settings.map.defaultZoom}
          minZoom={2}
          maxZoom={8}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          worldCopyJump
          className="h-full w-full"
        >
          <TileLayer
            url={ARCGIS_LIGHT_GRAY_TILES}
            attribution='Tiles &copy; Esri | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {circles.map((circle) => (
            <Marker
              key={circle.slug}
              position={[circle.coordinates.lat, circle.coordinates.lng]}
              icon={yellowMarkerIcon}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-display text-brand-dark-green mb-1 text-base">
                    {circle.name}
                  </p>
                  <p className="text-mono-s text-brand-dark-green/70 mb-3">
                    {[circle.city, circle.country].filter(Boolean).join(', ')}
                  </p>
                  <Link
                    href={ROUTES.circle(circle.slug)}
                    className="text-eyebrow text-brand-dark-green cursor-pointer border-b border-current/50"
                  >
                    {circle.name}
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
          <AttributionControl position="bottomright" prefix={false} />
          <ZoomControls
            zoomInAriaLabel={settings.map.zoomInAriaLabel}
            zoomOutAriaLabel={settings.map.zoomOutAriaLabel}
          />
        </MapContainer>
      </div>
    </section>
  )
}
