import Image from 'next/image'

import type { RoadmapCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'

interface RoadmapHeroProps {
  data: RoadmapCopySection['hero']
}

export function RoadmapHero({ data }: RoadmapHeroProps) {
  return (
    <section className="relative h-[420px] overflow-hidden bg-brand-off-white md:-mt-0.5 md:h-[447px]">
      <div className="absolute inset-0 desktop:inset-auto desktop:top-[-204px] desktop:right-0 desktop:left-[-166px] desktop:h-[688px]">
        <Image
          src={data.image.src}
          alt={data.image.alt}
          fill
          sizes="(min-width: 1440px) calc(100vw + 166px), 100vw"
          className="-scale-x-100 object-cover [object-position:35%_center] desktop:[object-position:center]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(105.3deg,rgba(0,0,0,0.5)_34.057%,rgba(0,0,0,0)_89.68%)]" />
      </div>

      <ContentWidth className="relative h-full text-brand-off-white">
        <h1 className="text-h2 absolute top-[100px] left-1/2 w-[min(464px,calc(100vw-24px))] -translate-x-1/2 text-center whitespace-pre-line text-brand-off-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] md:top-[140px]">
          {data.heading}
        </h1>

        <p className="text-mono-s absolute top-[225px] left-1/2 w-[226px] -translate-x-1/2 text-center text-brand-off-white md:top-[263px]">
          {data.eyebrow}
        </p>

        <p className="text-mono-s absolute bottom-5 left-1/2 w-[min(702px,calc(100vw-24px))] -translate-x-1/2 text-center text-brand-off-white">
          {data.disclaimer}
        </p>
      </ContentWidth>
    </section>
  )
}
