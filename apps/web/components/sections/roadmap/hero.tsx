import type { RoadmapCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'

interface RoadmapHeroProps {
  data: RoadmapCopySection['hero']
}

export function RoadmapHero({ data }: RoadmapHeroProps) {
  return (
    <section className="relative h-[372px] overflow-hidden bg-brand-off-white md:-mt-0.5 md:h-[447px]">
      <ContentWidth className="relative h-full text-brand-dark-green">
        <p className="text-mono-s absolute top-10 left-3 w-[min(342px,calc(100vw-24px))] text-left md:top-[58px] md:left-[calc(50%+6px)] md:w-[min(342px,calc(50vw-18px))]">
          {data.eyebrow}
        </p>

        <h1 className="text-h2 absolute top-[128px] left-3 w-[min(464px,calc(100vw-24px))] whitespace-pre-line text-brand-dark-green [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] md:top-[140px]">
          {data.heading}
        </h1>

        <p className="text-mono-s absolute top-[259px] right-3 left-3 md:top-[356px] md:right-auto md:left-[calc(50%+6px)] md:w-[min(702px,calc(50vw-18px))]">
          {data.disclaimer}
        </p>
      </ContentWidth>
    </section>
  )
}
