import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

/**
 * About ATF — full-bleed mountain photo with hero display title overlaid.
 *
 * Figma desktop 40009046:27249 (h 800), mobile 40009046:27110 (matching ATF).
 */
export async function AboutHero() {
  const t = await getTranslations('pages.about.hero')

  return (
    <section className="relative h-[800px] w-full overflow-hidden">
      <Image
        src="/images/about/hero.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/*
       * Fluid hero size: the `text-hero` token jumps straight from 70px to
       * 140px at md (768px), which overflows the fixed-height hero between
       * 768–1440px. Override font-size with a clamp that scales 70→140px
       * linearly across that band (70px ≤768px, 140px ≥1440px). Inline style
       * beats the token's media query, so this stays scoped to /about.
       */}
      <h1
        className="text-hero absolute inset-x-0 top-[283px] mx-auto max-w-[369px] px-3 text-center text-brand-off-white md:max-w-none"
        style={{ fontSize: 'clamp(70px, calc(10.42vw - 10px), 140px)' }}
      >
        {t('title')}
      </h1>
    </section>
  )
}
