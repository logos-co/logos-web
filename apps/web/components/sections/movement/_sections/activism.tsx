import Image from 'next/image'
import { type CircleInitiative } from '@repo/content/loaders'
import type { MovementCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { ArrowIcon } from '@/components/sections/circles/_helpers'

import { LambdaBadge, SectionHeader } from './atoms'

function IssueCard({ initiative }: { initiative: CircleInitiative }) {
  const city = initiative.locationLabel.split(',')[0]
  const className =
    'relative h-[282px] w-full shrink-0 overflow-hidden rounded-xl text-brand-off-white md:w-[440px] md:snap-start'

  const content = (
    <>
      <Image
        src={initiative.image.src}
        alt=""
        fill
        sizes="440px"
        className="scale-125 object-cover blur-[20px]"
      />
      <div className="absolute inset-0 bg-black/20" />
      <span
        aria-hidden="true"
        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green pointer-events-none"
      >
        <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35]">
          View issue
        </span>
        <ArrowIcon />
      </span>
      <div className="absolute inset-3 flex flex-col justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <LambdaBadge size={15} tone="light" circle />
          <p className="text-subhead-serif">{city}</p>
        </div>
        <h3 className="text-subhead-sans mx-auto max-w-[220px] text-center">
          {initiative.title}
        </h3>
        <p className="text-mono-s line-clamp-4 w-[220px]">
          {initiative.description}
        </p>
      </div>
    </>
  )

  if (initiative.href) {
    return (
      <a
        href={initiative.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block transition-opacity hover:opacity-90 ${className}`}
      >
        {content}
      </a>
    )
  }

  return <article className={className}>{content}</article>
}

export function ActivismSection({
  data,
  initiatives,
}: {
  data: MovementCopySection
  initiatives: CircleInitiative[]
}) {
  const cards = initiatives.slice(0, 3)

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pb-10 text-brand-dark-green md:pb-25">
      <SectionHeader
        title={data.activismSection.title}
        description={data.activismSection.body}
        className="pb-10 md:pb-19.5"
      />
      <ContentWidth className="overflow-x-auto">
        <div className="grid gap-3 md:flex md:w-max md:snap-x">
          {cards.map((initiative) => (
            <IssueCard key={initiative.slug} initiative={initiative} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
