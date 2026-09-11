import Image from 'next/image'

import { Button } from '@/components/ui'

import { HERO } from '../_content'
import { TRIM } from './atoms'

export function Hero() {
  const [firstLine, secondLine] = HERO.heading

  return (
    <section className="relative h-[800px] overflow-hidden bg-brand-dark-green text-brand-off-white">
      <Image
        src="/images/prifi/hero.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Figma centres this group, which puts it 253.5px down. The 12px CTA
          copy (10px in the file) makes the group taller, so desktop pins the
          top instead of letting the heading ride up. */}
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-[60px] px-3 text-center lg:top-[253.5px] lg:translate-y-0">
        {/* Figma counts the space that ends each of these lines when it
            centres them; the non-breaking space keeps that offset. */}
        <h1 className={`text-h2 w-full ${TRIM}`}>
          {firstLine}
          {' '}
          <br />
          {secondLine}
        </h1>
        {/* Figma fixes this frame at 44px and lets the copy run past it, so
            the CTAs sit 60px below the frame rather than below the text.
            Narrow screens wrap the copy onto more lines, so it hugs there. */}
        <div
          className={`text-body-sans w-full max-w-[462px] lg:h-[44px] ${TRIM}`}
        >
          <p>
            {HERO.body[0]}
            {' '}
          </p>
          <p className="mt-[1.2em]">{HERO.body[1]}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          <Button
            href={HERO.primaryCta.href}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green"
          >
            {HERO.primaryCta.label}
          </Button>
          <Button
            href={HERO.secondaryCta.href}
            variant="secondary"
            className="cursor-pointer border-brand-off-white/50 text-brand-off-white"
          >
            {HERO.secondaryCta.label}
          </Button>
        </div>
      </div>
    </section>
  )
}
