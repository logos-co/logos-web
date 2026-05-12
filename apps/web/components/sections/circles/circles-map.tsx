'use client'

import dynamic from 'next/dynamic'

import type { Circle } from '@repo/content/loaders'
import type { CirclesSettings } from '@repo/content/schemas'

const CirclesLeafletMap = dynamic(() => import('./circles-leaflet-map'), {
  ssr: false,
  loading: () => (
    <section id="map" className="bg-brand-off-white px-3 pb-3 md:pb-12">
      <div className="relative mx-auto h-[720px] max-w-[369px] overflow-hidden rounded-[100px] bg-gray-01 md:h-[675px] md:max-w-[1416px] md:rounded-[64px]" />
    </section>
  ),
})

export default function CirclesMap({
  settings,
  circles,
}: {
  settings: CirclesSettings
  circles: Circle[]
}) {
  return <CirclesLeafletMap settings={settings} circles={circles} />
}
