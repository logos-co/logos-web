import Image from 'next/image'
import type { BuilderHubSettings } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'

import { externalProps } from './atoms'
import type { Cta } from './types'

export function BuildersHubHero({ hero }: { hero: BuilderHubSettings['hero'] }) {
  const ctas = [...(hero.secondaryCtas ?? []), hero.topRightCta].filter(
    (cta): cta is Cta => Boolean(cta)
  )

  return (
    <section className="relative h-[483px] pt-6 md:h-[487px]">
      <ContentWidth className="relative h-full">
        <div className="absolute top-6 left-3 h-[75px] w-[107px] overflow-hidden">
          <Image
            src="/images/builders-hub/hero.webp"
            alt=""
            width={125}
            height={157}
            className="absolute -top-[29px] -left-[7px] h-[157px] w-[125px] object-cover"
            priority
          />
        </div>

        {hero.eyebrow ? (
          <p className="absolute top-6 left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[178px] text-mono-s md:left-1/2 md:w-[226px] md:max-w-none md:translate-x-[6px]">
            {hero.eyebrow}
          </p>
        ) : null}

        <div className="absolute top-[279px] left-3 flex flex-col items-start gap-3 md:top-[11px] md:left-[83.33%] md:translate-x-[2px] md:gap-1.5">
          {ctas.map((cta) => (
            <Button
              key={cta.label}
              href={cta.href}
              variant="link"
              {...externalProps(cta)}
            >
              {cta.label}
            </Button>
          ))}
        </div>

        <h1 className="absolute top-[140px] left-1/2 w-[min(464px,calc(100vw-24px))] -translate-x-1/2 text-center font-display text-[40px] leading-[0.86] tracking-[-0.03em] text-brand-dark-green md:w-[464px] md:text-[56px]">
          <span className="block">Logos</span>
          <span className="block">Builders Hub</span>
        </h1>

        {hero.description ? (
          <p className="absolute top-[279px] left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[178px] text-mono-s md:top-[307px] md:left-1/2 md:w-[226px] md:max-w-none md:translate-x-[6px]">
            {hero.description}
          </p>
        ) : null}
      </ContentWidth>
    </section>
  )
}
