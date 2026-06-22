import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import type { BroadcastNetworkCopy } from './types'

export function BroadcastHero({ copy }: { copy: BroadcastNetworkCopy }) {
  return (
    <section className="bg-accent-tan pb-25 pt-6 text-brand-dark-green md:pt-6">
      <ContentWidth className="flex w-full flex-col gap-10">
        <div className="flex w-full max-w-[1186px] items-start justify-between gap-6">
          <div className="relative h-[86px] w-[107px] shrink-0 overflow-hidden">
            <Image
              src="/images/blog-engine/press-hero.jpg"
              alt=""
              fill
              sizes="107px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <p className="text-mono-s w-[226px]">{copy.introPrimary}</p>
        </div>
        <h1 className="text-h2 text-center">
          <span className="block">Logos Broadcast</span>
          <span className="block">Network</span>
        </h1>
        <div className="flex w-full max-w-[1186px] mt-10 justify-end">
          <p className="text-mono-s w-[226px]">{copy.introSecondary}</p>
        </div>
      </ContentWidth>
    </section>
  )
}
