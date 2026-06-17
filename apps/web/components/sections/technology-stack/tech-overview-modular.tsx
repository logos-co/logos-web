import Image from 'next/image'

import type { FeaturedTextSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'

type Props = {
  data: FeaturedTextSection
}

export default function TechOverviewModular({ data }: Props) {
  return (
    <section className="mt-0 mb-7 lg:mt-42.5 lg:mb-25.5 xl:mt-25.5">
      <div className="bg-brand-off-white p-3">
        <ContentWidth>
          <div className="-mx-3 grid gap-3 lg:mx-0 lg:grid-cols-2">
            <div className="relative h-[248px] overflow-hidden rounded-[100px] lg:h-129.5 lg:rounded-[100px]">
              <Image
                src={
                  data.image?.src ??
                  '/images/technology-stack/modular-landscape.webp'
                }
                alt={data.image?.alt ?? ''}
                fill
                sizes="(max-width: 1023px) 369px, 702px"
                className="object-cover object-center"
              />
            </div>

            <div className="relative flex h-[572px] flex-col items-center justify-center overflow-hidden rounded-xl bg-gray-01 p-6 lg:h-129.5">
              <div className="flex w-full max-w-[321px] flex-col items-center text-center lg:mx-auto lg:max-w-116">
                <h2 className="text-h3-serif w-[320px] text-brand-dark-green lg:w-full">
                  <span className="block lg:inline">
                    {data.title.highlight}
                  </span>
                  <span className="block lg:inline">
                    <span className="hidden lg:inline"> </span>
                    {data.title.rest}
                  </span>
                </h2>

                {data.body && data.body.length > 0 ? (
                  <div className="mt-15 flex w-full flex-col gap-3 text-left text-[12px] leading-[1.2] font-medium text-brand-dark-green lg:mt-10">
                    {data.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </ContentWidth>
      </div>
    </section>
  )
}
