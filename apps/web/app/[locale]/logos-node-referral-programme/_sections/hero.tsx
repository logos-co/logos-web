import Image from 'next/image'
import type { NodeReferralProgrammeCopySection } from '@repo/content/schemas'

import { ProgrammeWidth } from './layout'
import { ProgrammeButton } from './button'
import { EXTERNAL_URLS } from '@/constants/routes'

import { NodeProgrammeSignupForm } from '../node-programme-signup-form'

interface NodeProgrammeHeroProps {
  hero: NodeReferralProgrammeCopySection['hero']
  signup: NodeReferralProgrammeCopySection['signup']
}

export function NodeProgrammeHero({ hero, signup }: NodeProgrammeHeroProps) {
  return (
    <section
      className="pt-3 pb-20 lg:pb-[146px]"
      aria-labelledby="node-programme-title"
    >
      <ProgrammeWidth>
        <div className="relative flex min-h-[480px] items-end overflow-hidden rounded-xl p-5 md:h-[640px] md:px-6 md:pt-6 md:pb-7">
          <picture>
            <source
              type="image/avif"
              srcSet={hero.image.avifSrcSet}
              sizes="calc(100vw - 24px)"
            />
            <source
              type="image/webp"
              srcSet={hero.image.srcSet}
              sizes="calc(100vw - 24px)"
            />
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="calc(100vw - 24px)"
              className="object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,37,33,0.25)_0%,rgba(21,37,33,0.15)_45%,rgba(21,37,33,0.85)_100%)]" />
          <h1
            id="node-programme-title"
            className="relative max-w-full font-display text-[clamp(48px,9.72vw,140px)] leading-[0.98] tracking-[-0.04em] whitespace-pre-line text-brand-off-white"
          >
            {hero.title}
          </h1>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 md:mt-12 lg:grid-cols-12 lg:gap-0">
          <p className="max-w-[640px] font-sans text-2xl leading-[1.1] tracking-[-0.01em] lg:col-span-6">
            {hero.body}
          </p>
          <div className="min-w-0 lg:col-span-4 lg:-translate-y-px lg:pr-3.5">
            <NodeProgrammeSignupForm copy={signup} />
          </div>
          <div className="flex items-start lg:col-span-2 lg:justify-center lg:pt-[30px]">
            <ProgrammeButton
              href={EXTERNAL_URLS.discord}
              variant="secondary"
              className="cursor-pointer"
            >
              {hero.discordCta}
            </ProgrammeButton>
          </div>
        </div>
      </ProgrammeWidth>
    </section>
  )
}
