'use client'

import Image from 'next/image'

import type { FeaturedTextSection, GallerySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

/**
 * Per-image desktop dimensions are positional — Figma's gallery has four
 * cards at fixed widths/heights to match the photo crops. Editors keep the
 * slot order stable; reordering would shuffle aspect ratios.
 */
const DESKTOP_DIMENSIONS = [
  { w: 407, h: 502 },
  { w: 534, h: 667 },
  { w: 466, h: 577 },
  { w: 596, h: 402 },
]

function MobileGalleryCard({
  src,
  alt,
  caption,
  date,
}: {
  src: string
  alt: string
  caption: string
  date: string
}) {
  return (
    <div className="w-[calc(100vw-24px)] max-w-[357px] shrink-0 snap-start">
      <div className="h-[440px] w-full overflow-hidden rounded-[70px] bg-brand-dark-green/10">
        <Image
          src={src}
          alt={alt}
          width={356}
          height={440}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="text-eyebrow mt-2.5 flex items-center justify-between px-1 text-brand-dark-green/60">
        <span>{caption}</span>
        <span>{date}</span>
      </div>
    </div>
  )
}

function DesktopGalleryCard({
  src,
  alt,
  w,
  h,
  caption,
  date,
}: {
  src: string
  alt: string
  w: number
  h: number
  caption: string
  date: string
}) {
  return (
    <div className="shrink-0" style={{ width: `${w}px` }}>
      <div
        className="overflow-hidden rounded-[100px] bg-brand-dark-green/10"
        style={{ height: `${h}px` }}
      >
        <Image
          src={src}
          alt={alt}
          width={w}
          height={h}
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className="mt-2 flex gap-6 px-1">
        <span className="text-eyebrow text-brand-dark-green/60">{caption}</span>
        <span className="text-eyebrow text-brand-dark-green/60">{date}</span>
      </div>
    </div>
  )
}

type Props = {
  /** Highlighted-word headline + CTA above the gallery. */
  headline: FeaturedTextSection
  /** Gallery items for the cards row below the headline. */
  gallery: GallerySection
}

export default function ParallelSocietySection({ headline, gallery }: Props) {
  const items = gallery.items.map((item, index) => ({
    src: item.image.src,
    alt: item.image.alt,
    caption: item.caption ?? '',
    date: item.date ?? '',
    desktop: DESKTOP_DIMENSIONS[index] ?? DESKTOP_DIMENSIONS[0],
  }))

  return (
    <section className="bg-brand-off-white shadow-[inset_0_1px_0_rgba(21,37,33,0.1)]">
      <ContentWidth className="relative px-3 pt-[132px] pb-[100px] min-[1025px]:pt-[132px] min-[1025px]:pb-0">
        <Reveal
          amount={0.4}
          delay={0.18}
          viewportMargin="0px 0px -20% 0px"
          className="mb-15"
        >
          <h2 className="text-h1 text-brand-dark-green text-center">
            <span className="text-brand-dark-green">
              {headline.title.highlight}
            </span>{' '}
            <span className="text-gray-04">{headline.title.rest}</span>
          </h2>
        </Reveal>

        {headline.cta ? (
          <div className="mb-[70px] flex justify-center min-[1025px]:mb-[111px]">
            <Button
              href={headline.cta.href}
              variant="link"
              className="cursor-pointer transition-opacity hover:opacity-70"
              target={headline.cta.external ? '_blank' : undefined}
              rel={headline.cta.external ? 'noopener noreferrer' : undefined}
            >
              {headline.cta.label}
            </Button>
          </div>
        ) : null}
      </ContentWidth>

      {/* Mobile Gallery — full width with internal scroll */}
      <div
        className="overflow-x-auto px-3 pb-[100px] min-[1025px]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex w-max snap-x snap-mandatory items-start gap-3">
          {items.map((item) => (
            <MobileGalleryCard
              key={item.src}
              src={item.src}
              alt={item.alt}
              caption={item.caption}
              date={item.date}
            />
          ))}
        </div>
      </div>

      {/* Desktop Gallery — full width with centered content and internal scroll */}
      {/* pb-[88px] + Press section py-3 (12px) = 100px gallery→Press gap per Figma */}
      <div
        className="hidden overflow-x-auto min-[1025px]:block min-[1025px]:pb-[88px]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-start gap-3 px-3 mx-auto w-fit">
          {items.map((item) => (
            <DesktopGalleryCard
              key={item.src}
              src={item.src}
              alt={item.alt}
              w={item.desktop.w}
              h={item.desktop.h}
              caption={item.caption}
              date={item.date}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
