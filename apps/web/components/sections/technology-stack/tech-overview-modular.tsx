import Image from 'next/image'

import type { FeaturedTextSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'

type Props = {
  data: FeaturedTextSection
}

export default function TechOverviewModular({ data }: Props) {
  return (
    <section className="my-10 bg-brand-off-white p-3 md:my-[102px]">
      <div className="mx-auto max-w-354">
        <div className="grid gap-3 md:grid-cols-2">
          <Reveal className="relative h-[248px] overflow-hidden rounded-[100px] md:h-[518px] md:rounded-xl">
            <Image
              src={
                data.image?.src ??
                '/images/technology-stack/modular-landscape.jpg'
              }
              alt={data.image?.alt ?? ''}
              fill
              sizes="(max-width: 767px) 369px, 702px"
              className="object-cover object-center"
            />
          </Reveal>

          <Reveal
            amount={0.2}
            className="relative h-[572px] overflow-hidden rounded-xl bg-gray-01 p-6 md:h-[518px]"
          >
            {data.eyebrow ? (
              <div className="text-mono-s absolute top-[-7px] left-1/2 flex -translate-x-1/2 items-center gap-[88px] text-brand-dark-green uppercase opacity-0 md:top-6 md:left-6 md:translate-x-0 md:gap-[81px] md:opacity-100">
                <span className="size-[7px] rotate-45 bg-brand-dark-green" />
                <span>{data.eyebrow}</span>
              </div>
            ) : null}

            <div className="mx-auto mt-[82px] flex max-w-[464px] flex-col items-center text-center md:mt-[113px]">
              <h2 className="text-h3-serif w-[320px] text-brand-dark-green md:w-full">
                <span className="block md:inline">{data.title.highlight}</span>
                <span className="block md:inline">
                  <span className="hidden md:inline"> </span>
                  {data.title.rest}
                </span>
              </h2>

              {data.body && data.body.length > 0 ? (
                <Reveal
                  stagger
                  amount={0.5}
                  className="mt-[60px] flex w-[321px] flex-col gap-3 text-left text-[12px] leading-[1.2] font-medium text-brand-dark-green md:mt-10 md:w-full"
                >
                  {data.body.map((paragraph) => (
                    <RevealItem key={paragraph}>
                      <p>{paragraph}</p>
                    </RevealItem>
                  ))}
                </Reveal>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
