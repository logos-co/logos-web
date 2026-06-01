import { getTranslations } from 'next-intl/server'

import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'

/**
 * About — initiative banner. Full-bleed photo card with centered λ mark and
 * caption rendered in serif H3 over the image.
 *
 * Figma desktop 40009046:27272 (h 912 frame, image inset 12 px on all sides
 * with rounded-[24px]).
 */
export async function AboutInitiative() {
  const t = await getTranslations('pages.about.initiative')

  return (
    <section className="bg-brand-off-white px-3 py-3">
      <ContentWidth className="relative h-[675px] w-full overflow-hidden rounded-[24px] md:h-[800px]">
        <video
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/about/mountain-optimized.mp4" type="video/mp4" />
        </video>
        <LogosMark
          size={35}
          className="absolute top-[379px] left-3 text-brand-off-white md:left-[calc(50%+6px)] md:size-[41px]"
        />
        <p className="text-h3-serif absolute top-[441px] left-3 max-w-[345px] text-brand-off-white md:left-[calc(50%+6px)] md:max-w-[464px]">
          {t('caption')}
        </p>
      </ContentWidth>
    </section>
  )
}
