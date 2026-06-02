import Image from 'next/image'

import type { CtaPanelSection } from '@repo/content/schemas'

import { OverviewMediaPanel } from '@/components/sections/shared/overview-media-panel'

import { paragraphs } from './atoms'

export function LocalFirstSection({ data }: { data: CtaPanelSection }) {
  return (
    <section>
      <OverviewMediaPanel
        eyebrow={data.eyebrow}
        footerLabel={data.footerLabel}
        title={data.title}
        body={paragraphs(data.description)}
        cta={data.cta}
        imagePosition="left"
        image={
          <div className="relative h-[317px] w-full overflow-hidden rounded-[24px] md:h-full">
            {data.image ? (
              <Image
                src={data.image.src}
                alt={data.image.alt}
                fill
                sizes="(max-width: 768px) 100vw, 702px"
                className="object-cover"
              />
            ) : null}
          </div>
        }
      />
    </section>
  )
}
