'use client'

import dynamic from 'next/dynamic'

import type { ActiveCircleMarker, ActiveCircleUpcomingEvent } from '@/lib/active-circles'

// Leaflet relies on `window`/`document` at module evaluation, so the heavy map
// module must be excluded from server-side rendering. With `output: 'export'`,
// the map is hydrated only in the browser; the placeholder is baked into the
// static HTML.
const CirclesWorldMap = dynamic(() => import('./circles-world-map'), {
  ssr: false,
  loading: () => (
    <div className="text-mono-s text-brand-dark-green/60 flex h-full w-full items-center justify-center bg-gray-01">
      Loading map…
    </div>
  ),
})

type CirclesWorldMapLoaderProps = {
  markers: ActiveCircleMarker[]
  upcomingEvents?: ActiveCircleUpcomingEvent[]
  locale?: string
  center?: [number, number]
  zoom?: number
  zoomInAriaLabel?: string
  zoomOutAriaLabel?: string
  gestureHintLabel?: string
}

export default function CirclesWorldMapLoader(
  props: CirclesWorldMapLoaderProps
) {
  return <CirclesWorldMap {...props} />
}
