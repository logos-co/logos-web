import Image from 'next/image'

import type { TechStackOverviewSection } from '@repo/content/schemas'

import { OverviewMediaPanel } from '@/components/sections/shared/overview-media-panel'
import { TechStackDiagram } from '@/components/sections/shared/tech-stack-diagram'
import ContentWidth from '@/components/layout/content-width'

type Props = {
  data: TechStackOverviewSection
  /**
   * Where the networking row links to. Page-level concern (the section
   * fixture covers the four pillars; the networking row is a shared link
   * across pages).
   */
  networkingHref: string
  /** Where the foundation row links to. Same rationale as `networkingHref`. */
  foundationHref: string
}

export default function TechOverviewStack({
  data,
  networkingHref,
  foundationHref,
}: Props) {
  return (
    <section id="stack">
      <div className="bg-brand-off-white px-0 pb-6 md:px-3 md:pb-25">
        <ContentWidth>
          {data.architecture ? (
            <OverviewMediaPanel
              className="relative left-1/2 mb-10 w-screen -translate-x-1/2 md:static md:left-auto md:mb-35 md:w-auto md:-translate-x-0 md:-mx-3 min-[1367px]:mb-50!"
              eyebrow={data.architecture.eyebrow}
              footerLabel={data.pillars[0].title}
              title={data.architecture.title}
              body={data.architecture.body}
              cta={data.architecture.cta}
              primaryCtaDefaultVariant="secondary"
              image={
                <div className="relative h-[317px] w-full overflow-hidden rounded-[24px] md:h-full">
                  <div className="absolute top-[-53px] left-0 h-[936px] w-full md:top-[-33px]">
                    <Image
                      src={data.architecture.image.src}
                      alt={data.architecture.image.alt}
                      fill
                      sizes="702px"
                      className="object-cover"
                    />
                  </div>
                </div>
              }
            />
          ) : null}

          <div className="flex flex-col gap-15 min-[1367px]:gap-25">
            <div className="grid gap-3 pt-25 md:pt-0 min-[1367px]:grid-cols-2">
              {data.title ? (
                <h2 className="text-h4-sans min-[1367px]:text-h3-sans text-brand-dark-green">
                  {data.title}
                </h2>
              ) : null}
              {data.eyebrow ? (
                <p className="text-mono-s w-[226px] text-brand-dark-green">
                  {data.eyebrow}
                </p>
              ) : null}
            </div>

            <TechStackDiagram
              data={data}
              networkingHref={networkingHref}
              foundationHref={foundationHref}
              desktopAt1367
            />
          </div>
        </ContentWidth>
      </div>
    </section>
  )
}
