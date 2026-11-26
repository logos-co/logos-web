import Image from 'next/image'
import type { NodeProgrammeCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { EXTERNAL_URLS } from '@/constants/routes'

import { NodeProgrammeSignupForm } from '../node-programme-signup-form'

interface NodeProgrammeHeroProps {
  hero: NodeProgrammeCopySection['hero']
  signup: NodeProgrammeCopySection['signup']
}

export function NodeProgrammeHero({ hero, signup }: NodeProgrammeHeroProps) {
  return (
    <section
      className="pt-3 pb-20 lg:pb-[147px]"
      aria-labelledby="node-programme-title"
    >
      <ContentWidth>
        <div className="relative flex min-h-[480px] items-end overflow-hidden rounded-xl p-5 md:h-[640px] md:px-6 md:pt-6 md:pb-7">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            sizes="(max-width: 1440px) calc(100vw - 24px), 1416px"
            className="object-cover"
          />
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
          <div className="min-w-0 lg:col-span-4 lg:max-w-[458px]">
            <NodeProgrammeSignupForm copy={signup} />
          </div>
          <div className="flex items-start lg:col-span-2 lg:justify-center lg:pt-7">
            <Button
              href={EXTERNAL_URLS.discord}
              variant="secondary"
              className="cursor-pointer"
            >
              {hero.discordCta}
            </Button>
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
