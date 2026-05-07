'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  AttributionControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L, { Icon } from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'

import {
  getLatestEventsByCity,
  isCircleEvent,
  type CircleEvent,
} from '@/lib/circle-events'

type Props = {
  events: CircleEvent[]
}

const DEFAULT_CENTER: [number, number] = [25, 0]
const DEFAULT_ZOOM = 2
const ARCGIS_LIGHT_GRAY_TILES =
  'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'

const FIFTY_KM_METERS = 50_000
const EARTH_METERS_PER_PIXEL_AT_ZOOM_0 = 156_543.03392

function fiftyKmClusterRadius(zoom: number) {
  const metersPerPixel = EARTH_METERS_PER_PIXEL_AT_ZOOM_0 / Math.pow(2, zoom)
  return Math.max(1, Math.round(FIFTY_KM_METERS / metersPerPixel))
}

const yellowMarkerIcon = L.divIcon({
  className: 'logos-circle-marker',
  iconSize: [23, 23],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:9999px;background-color:#ffd328;">
      <span aria-hidden="true" style="display:block;width:9px;height:12px;background-color:#152521;mask:url(/icons/logos-mark.svg) center / contain no-repeat;-webkit-mask:url(/icons/logos-mark.svg) center / contain no-repeat;"></span>
    </div>
  `,
})

const fallbackMarkerIcon = new Icon({
  iconUrl: '/icons/logos-mark.svg',
  iconSize: [23, 23],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
})

function clusterIconCreator(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount()
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background-color:#ffd328;color:#152521;font-size:10px;font-weight:500;">${count}</div>`,
    className: 'logos-circle-cluster',
    iconSize: L.point(32, 32, true),
  })
}

function formatDateUTC(iso: string): string {
  if (!iso) return ''
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

function formatLocation(event: CircleEvent): string {
  const parts = [event.location_city, event.location_country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

function ZoomButton({
  ariaLabel,
  onClick,
  children,
}: {
  ariaLabel: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex h-[66px] w-[72px] cursor-pointer items-center justify-center rounded-full bg-brand-dark-green/90 text-brand-off-white backdrop-blur-[5px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-off-white"
    >
      {children}
    </button>
  )
}

function ZoomControls() {
  const map = useMap()
  return (
    <div className="pointer-events-auto absolute top-[50px] right-[52px] z-[400] flex gap-[9px]">
      <ZoomButton ariaLabel="Zoom out" onClick={() => map.zoomOut()}>
        <span className="block h-[2px] w-[11px] bg-current" />
      </ZoomButton>
      <ZoomButton ariaLabel="Zoom in" onClick={() => map.zoomIn()}>
        <span className="relative block h-[11px] w-[11px]">
          <span className="absolute top-1/2 left-0 block h-[2px] w-full -translate-y-1/2 bg-current" />
          <span className="absolute top-0 left-1/2 block h-full w-[2px] -translate-x-1/2 bg-current" />
        </span>
      </ZoomButton>
    </div>
  )
}

export default function CirclesMap({ events }: Props) {
  // Mounting after first client render keeps this component safe under
  // SSR / static export, even though `'use client'` already defers most
  // execution. `L.divIcon` and `new Icon(...)` are evaluated at module
  // load, so the loader wrapper uses `next/dynamic({ ssr: false })`.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Documented escape hatch if `divIcon` HTML ever fails to render.
  void fallbackMarkerIcon

  const markers = getLatestEventsByCity(events.filter(isCircleEvent))

  if (!mounted) {
    return (
      <div className="text-mono-s text-brand-dark-green/60 flex h-full w-full items-center justify-center bg-gray-01">
        Loading map…
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
        worldCopyJump
      >
        <TileLayer
          url={ARCGIS_LIGHT_GRAY_TILES}
          attribution='Tiles &copy; Esri | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MarkerClusterGroup
          maxClusterRadius={fiftyKmClusterRadius}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={clusterIconCreator}
        >
          {markers.map((event) => {
            const lat = Number(event.geo_latitude)
            const lng = Number(event.geo_longitude)
            return (
              <Marker
                key={event.event_id}
                position={[lat, lng]}
                icon={yellowMarkerIcon}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <p className="font-display text-brand-dark-green mb-2 text-base font-medium">
                      {event.event_name}
                    </p>
                    <div className="text-mono-s text-brand-dark-green space-y-1">
                      <p>
                        <strong>Location:</strong> {formatLocation(event)}
                      </p>
                      <p>
                        <strong>Date:</strong> {formatDateUTC(event.start_at)}
                      </p>
                      {event.event_url ? (
                        <p>
                          <a
                            href={event.event_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-light-blue cursor-pointer underline"
                          >
                            View Event
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>
        <AttributionControl position="bottomright" prefix={false} />
        <ZoomControls />
      </MapContainer>
    </div>
  )
}
