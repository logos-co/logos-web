import Image from 'next/image'

import { type CircleInitiative } from '@repo/content/loaders'
import type { CirclesSettings } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'

import { ArrowIcon, SmartLink } from '../_helpers'
import { SectionIntro } from './atoms'

function InitiativeCard({ initiative }: { initiative: CircleInitiative }) {
  return (
    <SmartLink
      href={initiative.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative h-[282px] overflow-hidden rounded-[12px] bg-brand-dark-green text-brand-off-white"
    >
      <Image
        src={initiative.image.src}
        alt={initiative.image.alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover blur-[8px] transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-3 flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex size-[15px] items-center justify-center rounded-full border border-brand-off-white">
            <LogosMark size={5} />
          </span>
          <span className="font-display text-[18px] leading-[1.1]">
            {initiative.locationLabel.split(',')[0]}
          </span>
        </div>
        <h3 className="mx-auto max-w-[280px] text-center font-sans text-[18px] leading-[1.15]">
          {initiative.title}
        </h3>
        <p className="text-mono-s max-w-[220px] overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] md:[-webkit-line-clamp:unset]">
          {initiative.description}
        </p>
      </div>

      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green">
        <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35]">
          {initiative.ctaLabel}
        </span>
        <ArrowIcon />
      </span>
    </SmartLink>
  )
}

export function InitiativesSection({
  settings,
  initiatives,
}: {
  settings: CirclesSettings
  initiatives: CircleInitiative[]
}) {
  return (
    <section
      id="initiatives"
      className="border-t border-brand-dark-green/10 bg-brand-off-white"
    >
      <SectionIntro
        title={settings.initiativesSection.title}
        cta={settings.initiativesSection.cta}
      />
      <ContentWidth className="grid gap-3 px-3 pb-12 md:grid-cols-3">
        {initiatives.map((initiative) => (
          <InitiativeCard key={initiative.slug} initiative={initiative} />
        ))}
      </ContentWidth>
    </section>
  )
}
