'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'

import type { ActiveCircleMarker, ActiveCircleUpcomingEvent } from '@/lib/active-circles'

const DEFAULT_CENTER: [number, number] = [20, 0]
const DEFAULT_ZOOM = 2
const MIN_ZOOM = 2
const MAX_ZOOM = 8
const ARCGIS_LIGHT_GRAY_TILES =
  'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'

const FIFTY_KM_METERS = 50_000
const EARTH_METERS_PER_PIXEL_AT_ZOOM_0 = 156_543.03392
const DEFAULT_EVENT_IMAGE = '/images/home/circles-card-bg.webp'

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

// Pin naive timestamps to UTC so times display deterministically across machines.
const toUtcInstant = (iso: string): Date => {
  const hasZone = /([zZ])|([+-]\d{2}:?\d{2})$/.test(iso)
  return new Date(hasZone ? iso : `${iso}Z`)
}

const fmtTime = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  }).format(toUtcInstant(iso))

const fmtDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(toUtcInstant(iso))

function EventPopupContent({
  event,
  locale,
}: {
  event: ActiveCircleUpcomingEvent
  locale: string
}) {
  const date = fmtDate(event.startAt, locale)
  const start = fmtTime(event.startAt, locale)
  const end = event.endAt ? fmtTime(event.endAt, locale) : null
  const timeLabel = end ? `${start} – ${end}` : start
  const location = [event.city, event.country].filter(Boolean).join(', ')

  const content = (
    <div className="grid min-w-66 grid-cols-[80px_minmax(0,1fr)] gap-3 p-1">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-[14px]">
        <Image
          src={event.coverUrl ?? DEFAULT_EVENT_IMAGE}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-between py-0.5">
        <p className="text-brand-dark-green line-clamp-2 text-sm font-medium leading-snug">
          {event.name}
        </p>
        <div className="mt-1 flex flex-col gap-0.5">
          <p className="text-brand-dark-green/80 text-xs">
            {date} · {timeLabel}
          </p>
          {location ? (
            <p className="text-brand-dark-green/60 truncate text-xs">{location}</p>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (event.eventUrl) {
    return (
      <a href={event.eventUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return <div>{content}</div>
}

function NoEventPopupContent({ marker }: { marker: ActiveCircleMarker }) {
  return (
    <div className="min-w-50 p-1">
      <p className="text-brand-dark-green text-sm font-medium">
        {marker.city}, {marker.country}
      </p>
      <p className="text-brand-dark-green/60 mt-1 text-xs">
        No upcoming events scheduled.
      </p>
    </div>
  )
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

// On touch devices a single-finger drag is reserved for scrolling the page, so
// the map only pans/zooms with two fingers (like Google Maps). When a one-finger
// drag is detected over the map, a short-lived hint tells the user how to move it.
function TouchGestureHandling({ hint }: { hint: string }) {
  const map = useMap()
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const isTouch =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches
    if (!isTouch) return

    const container = map.getContainer()
    // Start with dragging off so a single finger falls through to page scroll.
    map.dragging.disable()

    let hintTimeout: ReturnType<typeof setTimeout> | undefined
    const revealHint = () => {
      setShowHint(true)
      if (hintTimeout) clearTimeout(hintTimeout)
      hintTimeout = setTimeout(() => setShowHint(false), 1600)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length >= 2) {
        map.dragging.enable()
        setShowHint(false)
        if (hintTimeout) clearTimeout(hintTimeout)
      } else {
        map.dragging.disable()
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) revealHint()
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) map.dragging.disable()
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
      if (hintTimeout) clearTimeout(hintTimeout)
    }
  }, [map])

  if (!showHint) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[450] flex items-center justify-center">
      <div className="text-mono-s bg-brand-dark-green/85 text-brand-off-white rounded-full px-5 py-3 backdrop-blur-[5px]">
        {hint}
      </div>
    </div>
  )
}

type CirclesWorldMapProps = {
  markers: ActiveCircleMarker[]
  upcomingEvents?: ActiveCircleUpcomingEvent[]
  locale?: string
  center?: [number, number]
  zoom?: number
  zoomInAriaLabel?: string
  zoomOutAriaLabel?: string
  gestureHintLabel?: string
}

export default function CirclesWorldMap({
  markers,
  upcomingEvents = [],
  locale = 'en',
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  zoomInAriaLabel = 'Zoom in',
  zoomOutAriaLabel = 'Zoom out',
  gestureHintLabel = 'Use two fingers to move the map',
}: CirclesWorldMapProps) {
  // `L.divIcon(...)` is evaluated at module load, so this component must only
  // render in the browser. The loader wrapper enforces that with
  // `next/dynamic({ ssr: false })`; the mounted guard is a second safety net.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Build a city+country lookup so marker clicks show the soonest upcoming event.
  // Events are sorted soonest-first in the snapshot, so the first match wins.
  const eventsByCity = useMemo(() => {
    const lookup = new Map<string, ActiveCircleUpcomingEvent>()
    for (const event of upcomingEvents) {
      const key = `${event.city}|${event.country}`
      if (!lookup.has(key)) lookup.set(key, event)
    }
    return lookup
  }, [upcomingEvents])

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
          {markers.map((marker) => {
            const upcomingEvent =
              eventsByCity.get(`${marker.city}|${marker.country}`) ?? null
            return (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={yellowMarkerIcon}
              >
                <Popup maxWidth={320}>
                  {upcomingEvent ? (
                    <EventPopupContent event={upcomingEvent} locale={locale} />
                  ) : (
                    <NoEventPopupContent marker={marker} />
                  )}
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>
        <ZoomControls
          zoomInAriaLabel={zoomInAriaLabel}
          zoomOutAriaLabel={zoomOutAriaLabel}
        />
        <TouchGestureHandling hint={gestureHintLabel} />
      </MapContainer>
    </div>
  )
}
