import Image from 'next/image'
import type { BuilderHubSettings } from '@repo/content/schemas'

import { SectionFrame } from './atoms'

export function PrepareSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['prepare']>
}) {
  return (
    <SectionFrame id="prepare" index="02" title={data.title}>
      <div className="grid gap-3 md:grid-cols-2">
        {data.cards.map((card) => (
          <div
            key={card.title}
            className="flex h-[458px] flex-col gap-1.5 overflow-hidden rounded-xl bg-gray-01 p-1.5 md:h-[589px]"
          >
            {card.image ? (
              <div className="relative h-[314px] overflow-hidden rounded-md md:h-[313px]">
                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className={
                    card.imageFit === 'contain'
                      ? 'object-contain'
                      : 'object-cover'
                  }
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <h3 className="text-subhead-sans">{card.title}</h3>
              <p className="w-[338px] max-w-full text-mono-s">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}
