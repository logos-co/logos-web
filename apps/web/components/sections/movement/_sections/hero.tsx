import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import { LambdaBadge, movementImages } from './atoms'
import type { Translate } from './types'

export function HeroSection({ t }: { t: Translate }) {
  return (
    <section className="relative h-[494px] overflow-hidden bg-brand-off-white pt-6 text-brand-dark-green md:h-[427px]">
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

        <div className="absolute top-[130px] left-1/2 flex w-[348px] -translate-x-1/2 items-center justify-center gap-2.5 md:w-auto">
          <LambdaBadge size={42.503} />
          <h1 className="font-display text-[36px] leading-none tracking-[-0.03em] whitespace-nowrap md:text-[56px]">
            {t('hero.title')}
          </h1>
        </div>

        <div className="absolute top-[274px] left-1/2 w-[369px] max-w-[calc(100%-24px)] -translate-x-1/2 md:top-[256px] md:w-[min(422px,calc(50vw-18px))] md:max-w-none md:translate-x-[6px] lg:w-[422px]">
          <p className="text-mono-s">{t('hero.body')}</p>
        </div>
      </ContentWidth>
    </section>
  )
}
