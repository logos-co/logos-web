import Image from 'next/image'

import type { FeaturedTextSection } from '@repo/content/schemas'

type Props = {
  data: FeaturedTextSection
}

export default function TechOverviewModular({ data }: Props) {
  return (
    <section className="my-7 bg-brand-off-white p-3 md:my-[102px]">
      <div className="mx-auto max-w-354">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative h-[248px] overflow-hidden rounded-xl md:h-[518px]">
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
          </div>

          <div className="relative h-[572px] rounded-xl bg-gray-01 p-6 md:h-[518px]">
            {data.eyebrow ? (
              <div className="text-mono-s absolute top-6 left-6 flex items-center gap-[81px] text-brand-dark-green">
                <span className="size-[7px] rotate-45 bg-brand-dark-green" />
                <span>{data.eyebrow}</span>
              </div>
            ) : null}

            <div className="mx-auto flex max-w-[464px] flex-col items-center text-center md:mt-[13px]">
              <h2 className="text-h4-sans w-[320px] text-brand-dark-green md:w-full">
                {`${data.title.highlight} ${data.title.rest}`}
              </h2>

              {data.body && data.body.length > 0 ? (
                <div className="text-body-sans mt-[60px] flex flex-col gap-3 text-brand-dark-green md:mt-10">
                  {data.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
