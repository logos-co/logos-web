import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import { Cta, LambdaBadge, movementImages } from './atoms'
import type { Translate } from './types'

export function HeroSection({ t }: { t: Translate }) {
  return (
    <section className="relative h-[494px] overflow-hidden bg-brand-off-white pt-6 text-brand-dark-green md:h-[579px]">
      <ContentWidth className="relative h-full">
        <div className="relative h-[75px] w-[107px] overflow-hidden bg-gray-01">
          <Image
            src={movementImages.heroThumb}
            alt=""
            fill
            priority
            sizes="107px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <Cta
          href="#circles-map"
          label={t('hero.primaryCta')}
          tone="tertiary"
          className="absolute top-6 left-1/2 translate-x-[8px] md:translate-x-[6px]"
        />
        <p className="text-mono-s absolute top-6 left-[calc(83.333%+2px)] hidden w-[226px] md:block">
          {t('hero.kicker')}
        </p>

        <div className="absolute top-[130px] left-1/2 flex w-[348px] -translate-x-1/2 items-center justify-center gap-2.5 md:w-auto">
          <LambdaBadge size={42.503} />
          <h1 className="font-display text-[36px] leading-none tracking-[-0.03em] whitespace-nowrap md:text-[56px]">
            {t('hero.title')}
          </h1>
        </div>

        <div className="absolute top-[274px] left-1/2 w-[369px] max-w-[calc(100%-24px)] -translate-x-1/2 md:top-[337px] md:w-[min(422px,calc(50vw-18px))] md:max-w-none md:translate-x-[6px] lg:w-[422px]">
          <p className="text-mono-s">{t('hero.body')}</p>
          <Cta
            href="#activist-circle"
            label={t('hero.secondaryCta')}
            tone="tertiary"
            className="mt-10 ml-[191px] md:ml-0"
          />
        </div>
      </ContentWidth>
    </section>
  )
}
