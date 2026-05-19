import Image from 'next/image'

import type { HeroSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

type Props = {
  data: HeroSection
}

export default function TechOverviewHero({ data }: Props) {
  return (
    <section className="bg-brand-off-white px-3 pt-[50px] pb-10 md:pt-[62px] md:pb-[100px]">
      <div className="relative mx-auto max-w-354 md:h-[403px]">
        <div className="absolute top-0 left-0 hidden h-[75px] w-[107px] overflow-hidden md:block">
          <Image
            src={
              data.background?.src ?? '/images/technology-stack/header-top.jpg'
            }
            alt={data.background?.alt ?? ''}
            fill
            sizes="107px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="hidden md:block">
          <p className="text-mono-s absolute top-0 left-[714px] w-[226px] text-brand-dark-green">
            {data.eyebrow}
          </p>
          <p className="text-mono-s absolute top-[310px] left-[714px] w-[226px] text-brand-dark-green">
            {data.body}
          </p>
          {data.ctas && data.ctas.length > 0 ? (
            <div className="absolute top-[412px] left-[714px] flex gap-2.5">
              {data.ctas.map((cta, index) => (
                <Button
                  key={cta.label}
                  href={cta.href}
                  variant={index === 0 ? 'secondary' : 'tertiary'}
                  className="cursor-pointer"
                >
                  {cta.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="md:hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="relative h-[75px] w-[107px] shrink-0 overflow-hidden">
              <Image
                src={
                  data.background?.src ??
                  '/images/technology-stack/header-top.jpg'
                }
                alt={data.background?.alt ?? ''}
                fill
                sizes="107px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>

            <p className="text-mono-s w-[178px] text-brand-dark-green">
              {data.eyebrow}
            </p>
          </div>
        </div>

        <h1 className="text-h2 relative left-1/2 mt-0 w-[369px] max-w-none -translate-x-1/2 text-center text-brand-dark-green md:absolute md:top-[115px] md:left-[476px] md:mt-0 md:w-[464px] md:translate-x-0">
          {data.headline}
        </h1>

        <p className="text-mono-s mt-7 ml-auto w-[178px] text-brand-dark-green md:hidden">
          {data.body}
        </p>

        {data.ctas && data.ctas.length > 0 ? (
          <div className="mt-6 ml-auto flex w-[178px] flex-col items-start gap-2.5 md:hidden">
            {data.ctas.map((cta, index) => (
              <Button
                key={cta.label}
                href={cta.href}
                variant={index === 0 ? 'secondary' : 'tertiary'}
                className="cursor-pointer"
              >
                {cta.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="mt-[100px] h-[123px] border-t border-brand-dark-green/10 md:hidden" />
      </div>
    </section>
  )
}
