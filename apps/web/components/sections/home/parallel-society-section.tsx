import Image from 'next/image'

import type { FeaturedTextSection, GallerySection } from '@repo/content/schemas'

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
    <div className="w-[calc(100vw-3.25rem)] max-w-[22.25rem] min-w-[18rem] shrink-0 snap-start">
      <div className="aspect-[356/440] overflow-hidden rounded-[4.375rem] bg-brand-dark-green/10">
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
        className="overflow-hidden rounded-2xl bg-brand-dark-green/10 transition-transform duration-700 hover:scale-[1.02]"
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
    <section className="relative h-[1368px] overflow-hidden bg-brand-off-white">
      <div className="absolute top-[132px] right-3 left-3 mx-auto max-w-354">
        <h2 className="text-h1 text-brand-dark-green mb-4 text-center">
          <span className="text-brand-dark-green">
            {headline.title.highlight}{' '}
          </span>
          <span className="text-gray-04">{headline.title.rest}</span>
        </h2>

        {headline.cta ? (
          <div className="mb-10 flex justify-center">
            <Button
              href={headline.cta.href}
              variant="link"
              className="transition-opacity hover:opacity-70"
            >
              {headline.cta.label}
            </Button>
          </div>
        ) : null}
      </div>

      <div
        className="absolute top-[578px] right-0 left-0 overflow-x-auto px-3 pb-2 md:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex w-max snap-x snap-mandatory items-start gap-3 pr-3">
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

      {/* Gallery — bleed outside container on desktop */}
      <div
        className="absolute top-[578px] hidden items-start gap-3 px-3 md:flex"
        style={{ marginLeft: '-141px', width: 'calc(100% + 282px)' }}
      >
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
    </section>
  )
}
