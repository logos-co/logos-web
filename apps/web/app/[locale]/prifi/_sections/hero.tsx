import Image from 'next/image'
import type { PrifiCopySection } from '@repo/content/schemas'

import { CtaButton, TRIM } from './atoms'

type HeroCopy = PrifiCopySection['hero']

export function Hero({ copy }: { copy: HeroCopy }) {
  const [firstLine, secondLine] = copy.heading

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
          {'\u00a0'}
          <br />
          {secondLine}
        </h1>
        {/* Figma fixes this frame at 44px and lets the copy run past it, so
            the CTAs sit 60px below the frame rather than below the text.
            Narrow screens wrap the copy onto more lines, so it hugs there. */}
        <div className={`text-body-sans w-full max-w-[462px] ${TRIM}`}>
          {copy.body.map((paragraph, index) => (
            <p
              key={paragraph}
              className={index === 0 ? undefined : 'mt-[1.2em]'}
            >
              {paragraph}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          <CtaButton
            href={copy.primaryCta.href}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green"
          >
            {copy.primaryCta.label}
          </CtaButton>
          <CtaButton
            href={copy.secondaryCta.href}
            variant="secondary"
            className="cursor-pointer border-brand-off-white/50 text-brand-off-white"
          >
            {copy.secondaryCta.label}
          </CtaButton>
        </div>
      </div>
    </section>
  )
}
