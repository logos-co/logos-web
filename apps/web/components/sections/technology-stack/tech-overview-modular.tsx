import Image from 'next/image'

import type { FeaturedTextSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'

type Props = {
  data: FeaturedTextSection
}

export default function TechOverviewModular({ data }: Props) {
  return (
    <section className="mt-0 mb-7 xl:my-25.5">
      <div className="bg-brand-off-white p-3">
        <ContentWidth>
          <div className="-mx-3 grid gap-3 xl:mx-0 xl:grid-cols-2">
            <div className="relative h-[248px] overflow-hidden rounded-[100px] xl:h-[518px] xl:rounded-[100px]">
              <Image
                src={
                  data.image?.src ??
                  '/images/technology-stack/modular-landscape.jpg'
                }
                alt={data.image?.alt ?? ''}
                fill
                sizes="(max-width: 1279px) 369px, 702px"
                className="object-cover object-center"
              />
            </div>

            <div className="relative flex h-[572px] flex-col items-center justify-center overflow-hidden rounded-xl bg-gray-01 p-6 xl:block xl:h-[518px]">
              <div className="flex w-full max-w-[321px] flex-col items-center text-center xl:mx-auto xl:mt-[113px] xl:max-w-[464px]">
                <h2 className="text-h3-serif w-[320px] text-brand-dark-green xl:w-full">
                  <span className="block xl:inline">
                    {data.title.highlight}
                  </span>
                  <span className="block xl:inline">
                    <span className="hidden xl:inline"> </span>
                    {data.title.rest}
                  </span>
                </h2>

                {data.body && data.body.length > 0 ? (
                  <div className="mt-15 flex w-full flex-col gap-3 text-left text-[12px] leading-[1.2] font-medium text-brand-dark-green xl:mt-10">
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
