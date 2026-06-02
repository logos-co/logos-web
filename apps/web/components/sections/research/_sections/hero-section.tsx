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
    <section className="relative min-h-[447px] overflow-hidden bg-brand-off-white px-3 pt-6 text-brand-dark-green">
      <ContentWidth className="relative">
      <Image
        src="/images/research/hero-thumb.webp"
        alt=""
        width={107}
        height={75}
        priority
        className="h-[75px] w-[107px] object-cover"
      />
      <p className="text-mono-s absolute left-3 top-28 max-w-[226px] md:left-[calc(50%+6px)] md:top-6">
        {kicker}
      </p>
      <div className="absolute right-3 top-3 flex w-[116px] flex-col items-start gap-1.5 md:right-[calc(16.67%-104px)]">
        {ctas.map((cta) => (
          <CtaLink key={cta.label} {...cta} />
        ))}
      </div>
      <h1 className="text-h2 absolute left-1/2 top-[140px] w-[min(464px,calc(100%-24px))] -translate-x-1/2 whitespace-pre-line text-center text-brand-dark-green">
        {title}
      </h1>
      <p className="text-mono-s absolute left-3 top-[318px] max-w-[345px] md:left-[calc(50%+6px)] md:top-[307px] md:w-[226px]">
        {description}
      </p>
      </ContentWidth>
    </section>
  )
}
