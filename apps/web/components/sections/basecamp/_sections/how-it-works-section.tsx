import type { ReactNode } from 'react'
import Image from 'next/image'

import type { CTA, TableSection } from '@repo/content/schemas'

import { BasecampCta } from './basecamp-cta'

const DEFAULT_CLASS_NAMES = {
  root: 'grid w-full gap-6 px-3 py-10 lg:grid-cols-2 lg:pt-0 lg:pb-10',
  column:
    'flex flex-col gap-6 lg:min-h-[435px] xl:min-h-[549px] desktop:min-h-[621px] lg:justify-between lg:gap-8',
  title: 'text-h3-sans mb-[14px] text-brand-dark-green',
  intro: 'mb-10 flex flex-col gap-10 text-brand-dark-green',
  row: 'grid gap-4 pt-[6px] pb-3 lg:grid-cols-2 lg:gap-3',
  media:
    'relative aspect-[351/313] lg:aspect-auto lg:h-[435px] xl:h-[549px] desktop:h-[621px] overflow-hidden rounded-xl',
}

const DEFAULT_IMAGE = {
  src: '/images/home/figma-refresh/basecamp.webp',
  alt: '',
  className: 'object-cover object-[16%_top]',
}

interface HowItWorksSectionProps {
  data: TableSection
  /** Copy between the heading and the rows. */
  intro?: ReactNode
  /** Each slot replaces the default classes outright. */
  classNames?: Partial<typeof DEFAULT_CLASS_NAMES>
  image?: { src: string; alt: string; className: string }
  /** Umami event names for the CTAs, in render order. */
  eventNames?: readonly string[]
}

export function HowItWorksSection({
  data,
  intro,
  classNames,
  image = DEFAULT_IMAGE,
  eventNames,
}: HowItWorksSectionProps) {
  const slots = { ...DEFAULT_CLASS_NAMES, ...classNames }
  const downloadActions = [
    data.action,
    data.rows[0]?.secondaryCta,
    data.rows[0]?.cta,
  ].filter((cta): cta is CTA => Boolean(cta))

  return (
    <section className={slots.root}>
      <div className={slots.column}>
        <div>
          <h2 className={slots.title}>{data.title}</h2>
          {intro ? <div className={slots.intro}>{intro}</div> : null}
          <div className="divide-y divide-brand-dark-green/50 border-t border-brand-dark-green/50">
            {data.rows.map((row) => (
              <article key={row.number} className={slots.row}>
                <span className="text-eyebrow text-brand-dark-green">
                  {row.number}
                </span>
                <div className="grid gap-2">
                  {row.description ? (
                    <p className="text-mono-s text-brand-dark-green">
                      {row.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
        {downloadActions.length > 0 ? (
          <div className="flex flex-wrap items-start gap-1">
            {downloadActions.map((cta, index) => (
              <BasecampCta
                key={cta.label}
                cta={cta}
                className="cursor-pointer"
                eventName={eventNames?.[index]}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className={slots.media}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="(max-width: 1024px) calc(100vw - 24px), (max-width: 1440px) calc(50vw - 24px), 696px"
          className={image.className}
        />
      </div>
    </section>
  )
}
