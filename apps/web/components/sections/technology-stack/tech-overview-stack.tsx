import Image from 'next/image'

import { LogosMark } from '@acid-info/logos-ui'
import type { TechStackOverviewSection } from '@repo/content/schemas'

import { TechStackDiagram } from '@/components/sections/shared/tech-stack-diagram'
import { Button } from '@/components/ui'

function SectionMarker({
  label,
  mark = 'diamond',
  className,
}: {
  label: string
  mark?: 'diamond' | 'logos'
  className?: string
}) {
  return (
    <div
      className={`text-mono-s flex items-start gap-[102px] text-brand-dark-green ${className ?? ''}`}
    >
      {mark === 'logos' ? (
        <LogosMark size={9} className="shrink-0" />
      ) : (
        <span className="mt-px size-[7px] shrink-0 rotate-45 bg-brand-dark-green" />
      )}
      <span>{label}</span>
    </div>
  )
}

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
    <section
      id="stack"
      className="bg-brand-off-white px-3 pb-[27px] md:pb-[100px]"
    >
      <div className="mx-auto max-w-354">
        {data.architecture ? (
          <div className="-mx-3 mb-10 h-[658px] bg-gray-01 px-3 py-3 md:mb-[100px] md:h-[381px]">
            <div className="grid md:grid-cols-2 md:gap-3">
              <div className="relative h-[317px] md:h-[357px]">
                {data.architecture.eyebrow ? (
                  <div className="absolute top-0 left-0">
                    <SectionMarker
                      label={data.architecture.eyebrow}
                      mark="logos"
                    />
                  </div>
                ) : null}

                <div className="absolute top-[50px] left-0 max-w-[485px] md:top-[77px]">
                  <h2 className="text-h4-sans text-brand-dark-green">
                    {data.architecture.title}
                  </h2>
                  <div className="mt-3 flex flex-col gap-3 text-[12px] leading-[1.2] font-medium text-brand-dark-green">
                    {data.architecture.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {data.architecture.cta ? (
                    <Button
                      href={data.architecture.cta.href}
                      variant="secondary"
                      className="mt-6 cursor-pointer"
                    >
                      {data.architecture.cta.label}
                    </Button>
                  ) : null}
                </div>

                <div
                  className="absolute top-[304px] left-0 opacity-0 md:top-[344px]"
                  aria-hidden="true"
                >
                  <SectionMarker label={data.pillars[0].title} />
                </div>
              </div>

              <div className="relative h-[317px] overflow-hidden rounded-[24px] md:h-[357px] md:rounded-xl">
                <div className="absolute top-[-53px] left-0 h-[936px] w-[702px] md:top-[-33px]">
                  <Image
                    src={data.architecture.image.src}
                    alt={data.architecture.image.alt}
                    fill
                    sizes="702px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-[60px] md:gap-[100px]">
          <div className="grid gap-3 pt-[100px] md:grid-cols-2">
            {data.title ? (
              <h2 className="text-h4-sans md:text-h3-sans text-brand-dark-green">
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
          />
        </div>
      </div>
    </section>
  )
}
