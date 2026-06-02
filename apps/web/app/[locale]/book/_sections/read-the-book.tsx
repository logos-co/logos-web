import Image from 'next/image'

import { ActionGroup } from './atoms'

export function ReadTheBook() {
  return (
    <section className="relative mx-3 mt-3 overflow-hidden rounded py-24 text-center text-brand-off-white md:py-36">
      <Image
        src="/book/read-bg.webp"
        alt="Farewell gradient"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="relative z-10 mx-auto max-w-4xl px-3">
        <h2 className="font-display text-[44px] leading-none tracking-[-0.03em] md:text-[72px]">
          Read the book now
        </h2>
        <ActionGroup className="mt-8" />
      </div>
    </section>
  )
}
