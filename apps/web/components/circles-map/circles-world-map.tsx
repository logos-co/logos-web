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
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'

import type { ActiveCircleMarker } from '@/lib/active-circles'

const DEFAULT_CENTER: [number, number] = [20, 0]
const DEFAULT_ZOOM = 2
const MIN_ZOOM = 2
const MAX_ZOOM = 8
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
    <div style="display:flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:9999px;background-color:#ffd328;box-shadow:0 1px 6px rgba(0,0,0,0.18);">
      <span aria-hidden="true" style="display:block;width:9px;height:12px;background-color:#152521;mask:url(/icons/logos-mark.svg) center / contain no-repeat;-webkit-mask:url(/icons/logos-mark.svg) center / contain no-repeat;"></span>
    </div>
  `,
})

function clusterIconCreator(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount()
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background-color:#ffd328;color:#152521;font-size:10px;font-weight:500;">${count}</div>`,
    className: 'logos-circle-cluster',
    iconSize: L.point(32, 32, true),
  })
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
      className="flex h-[66px] w-[72px] cursor-pointer items-center justify-center rounded-full bg-brand-dark-green/90 text-brand-off-white backdrop-blur-[5px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-off-white md:size-10"
    >
      {children}
    </button>
  )
}

function ZoomControls({
  zoomInAriaLabel,
  zoomOutAriaLabel,
}: {
  zoomInAriaLabel: string
  zoomOutAriaLabel: string
}) {
  const map = useMap()
  return (
    <div className="pointer-events-auto absolute top-[47px] right-[33px] z-[400] flex flex-col gap-3 md:top-6 md:right-6 md:flex-row md:gap-[9px]">
      <ZoomButton ariaLabel={zoomOutAriaLabel} onClick={() => map.zoomOut()}>
        <span className="block h-[2px] w-[11px] bg-current" />
      </ZoomButton>
      <ZoomButton ariaLabel={zoomInAriaLabel} onClick={() => map.zoomIn()}>
        <span className="relative block h-[11px] w-[11px]">
          <span className="absolute top-1/2 left-0 block h-[2px] w-full -translate-y-1/2 bg-current" />
          <span className="absolute top-0 left-1/2 block h-full w-[2px] -translate-x-1/2 bg-current" />
        </span>
      </ZoomButton>
    </div>
  )
}

type CirclesWorldMapProps = {
  markers: ActiveCircleMarker[]
  center?: [number, number]
  zoom?: number
  zoomInAriaLabel?: string
  zoomOutAriaLabel?: string
}

export default function CirclesWorldMap({
  markers,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  zoomInAriaLabel = 'Zoom in',
  zoomOutAriaLabel = 'Zoom out',
}: CirclesWorldMapProps) {
  // `L.divIcon(...)` is evaluated at module load, so this component must only
  // render in the browser. The loader wrapper enforces that with
  // `next/dynamic({ ssr: false })`; the mounted guard is a second safety net.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
        center={center}
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
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
        <MarkerClusterGroup
          maxClusterRadius={fiftyKmClusterRadius}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={clusterIconCreator}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={yellowMarkerIcon}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-display text-brand-dark-green mb-1 text-base">
                    {marker.city}
                  </p>
                  <p className="text-mono-s text-brand-dark-green/70 mb-3">
                    {[marker.city, marker.country].filter(Boolean).join(', ')}
                  </p>
                  {marker.eventUrl ? (
                    <a
                      href={marker.eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-eyebrow text-brand-dark-green cursor-pointer border-b border-current/50"
                    >
                      View event
                    </a>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        <AttributionControl position="bottomright" prefix={false} />
        <ZoomControls
          zoomInAriaLabel={zoomInAriaLabel}
          zoomOutAriaLabel={zoomOutAriaLabel}
        />
      </MapContainer>
    </div>
  )
}
