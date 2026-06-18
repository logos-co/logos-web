import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import { CtaLink } from './atoms'
import type { LinkItem } from './types'

export function HeroSection({
  kicker,
  title,
  description,
  ctas,
}: {
  kicker: string
  title: string
  description: string
  ctas: LinkItem[]
}) {
  return (
    <section className="relative overflow-hidden bg-brand-off-white pt-6 text-brand-dark-green md:min-h-[447px]">
      <ContentWidth className="relative flex flex-col md:block">
        <div className="flex items-start justify-between md:block">
          <Image
            src="/images/research/hero-thumb.webp"
            alt=""
            width={107}
            height={75}
            priority
            className="h-[75px] w-[107px] object-cover"
          />
          <div className="flex w-[116px] flex-col items-start gap-1.5 md:absolute md:right-[calc(16.67%-104px)] md:top-3">
            {ctas.map((cta) => (
              <CtaLink key={cta.label} {...cta} />
            ))}
          </div>
        </div>
        <p className="text-mono-s mt-8 max-w-[226px] md:absolute md:left-[calc(50%+6px)] md:top-6 md:mt-0">
          {kicker}
        </p>
        <h1 className="text-h2 my-[70px] whitespace-pre-line text-center text-brand-dark-green md:absolute md:left-1/2 md:top-[120px] md:my-0 md:w-[min(464px,calc(100%-24px))] md:-translate-x-1/2">
          {title}
        </h1>
        <p className="text-mono-s max-w-[345px] md:absolute md:left-[calc(50%+6px)] md:top-[302px] md:w-[226px]">
          {description}
        </p>
      </ContentWidth>
    </section>
  )
}
