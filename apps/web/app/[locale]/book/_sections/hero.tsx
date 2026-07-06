import Image from 'next/image'

import { ActionGroup } from './atoms'

interface HeroProps {
  heading: string
}

export function Hero({ heading }: HeroProps) {
  return (
    <section className="relative min-h-screen overflow-hidden pt-10">
      <Image
        src="/book/farewell-hero.jpg"
        alt="Farewell to Westphalia banner"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-brand-dark-green/35" />
      <div className="relative z-10 flex min-h-[calc(100vh-40px)] flex-col items-center justify-end px-3 pb-16 text-center text-brand-off-white">
        <h1 className="max-w-5xl font-display text-[56px] leading-none tracking-[-0.03em] md:text-[104px]">
          {heading}
        </h1>
        <p className="mt-6 max-w-2xl font-sans text-[18px] leading-[1.2] md:text-[22px]">
          A book co-authored by Logos co-founder Jarrad Hope and Peter Ludlow
          that explores crypto sovereignty and post-nation-state governance
        </p>
        <ActionGroup className="mt-8" />
      </div>
    </section>
  )
}
