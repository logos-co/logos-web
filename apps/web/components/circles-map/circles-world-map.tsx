'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
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
import { submitNewsletterSignup } from '@/lib/newsletter-signup'

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
  const time = fmtTime(event.startAt, locale)
  const location = [event.city, event.country].filter(Boolean).join(', ')

  // Fixed 463px width — identical to the Upcoming Events card. Auto-sizing the
  // popup to the title proved unreliable: CSS-grid intrinsic sizing collapses
  // unpredictably inside Leaflet's white-space:nowrap measurement pass. With a
  // definite width the 1fr text column fills the remaining ~300px, so the title
  // shows in full and only truncates when it genuinely overflows.
  const cardClass =
    'grid w-[463px] grid-cols-[123px_minmax(0,1fr)] gap-3 rounded-[24px] bg-gray-01 p-1.5 pr-6 text-brand-dark-green transition-colors hover:bg-gray-02'

  // Non-<p> elements on purpose: Leaflet's stylesheet adds margin:1.3em to any
  // <p> inside .leaflet-popup-content, which would spread these lines apart.
  const content = (
    <>
      <div className="relative size-[123px] shrink-0 overflow-hidden rounded-[18px]">
        <Image
          src={event.coverUrl ?? DEFAULT_EVENT_IMAGE}
          alt=""
          fill
          sizes="123px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-between py-1">
        <h3 className="truncate pr-5 font-sans text-[18px] leading-[1.15] tracking-normal text-brand-dark-green">
          {event.name}
        </h3>
        <div className="flex flex-col gap-0.5">
          <span className="text-mono-s block text-brand-dark-green">{time}</span>
          {location ? (
            <span className="text-mono-s block truncate text-gray-05">
              {location}
            </span>
          ) : null}
        </div>
      </div>
    </>
  )

  if (event.eventUrl) {
    return (
      <a href={event.eventUrl} target="_blank" rel="noopener noreferrer" className={cardClass}>
        {content}
      </a>
    )
  }

  return <div className={cardClass}>{content}</div>
}

function NoEventPopupContent({ marker }: { marker: ActiveCircleMarker }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      await submitNewsletterSignup({
        email,
        role: 'activist',
        city: [marker.city, marker.country].filter(Boolean).join(', '),
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (status === 'success') {
    return (
      <div className="w-85 rounded-3xl bg-gray-01 p-5 text-brand-dark-green">
        <div className="pr-6 font-sans text-[18px] leading-[1.15]">Subscribed!</div>
        <div className="text-mono-s mt-1 text-gray-05">
          We&apos;ll let you know when events are scheduled for {marker.city}.
        </div>
      </div>
    )
  }

  return (
    <div className="w-85 rounded-3xl bg-gray-01 p-5 text-brand-dark-green">
      <div className="pr-6 font-sans text-[18px] leading-[1.15]">
        Stay Tuned for Future Events
      </div>
      <div className="text-mono-s mt-1 mb-4 text-gray-05">
        No events in {marker.city} right now — check back soon!
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          required
          disabled={status === 'loading'}
          className="text-brand-dark-green placeholder:text-gray-05 text-mono-s w-full rounded-full border border-brand-dark-green/20 bg-transparent px-4 py-2 outline-none focus:border-brand-dark-green/60 disabled:opacity-50"
        />
        {status === 'error' && (
          <div className="text-mono-s text-red-500">{errorMsg}</div>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="text-mono-s bg-brand-dark-green text-brand-off-white w-full rounded-full px-4 py-2 transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe →'}
        </button>
      </form>
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
                <Popup
                  className="logos-circle-popup"
                  minWidth={463}
                  maxWidth={480}
                  closeButton
                  autoPan>
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
