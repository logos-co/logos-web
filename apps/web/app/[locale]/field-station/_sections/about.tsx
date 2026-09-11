import Image from 'next/image'

import { StatCardView } from '@/components/sections/home/social-proof-section'

import { ABOUT, SECTION_IDS } from '../_content'

/**
 * 490×652 portrait beside the copy column; the column (heading, lead copy,
 * stat cards) is vertically centred on the image, as in Figma.
 */
export function About() {
  return (
    <section
      id={SECTION_IDS.about}
      className="mt-28 scroll-mt-12 bg-brand-off-white px-3 lg:py-[127px]"
    >
      <div className="mx-auto flex max-w-[1175px] flex-col items-center gap-[54px] lg:flex-row">
        <div className="relative aspect-[490/652] w-full max-w-[490px] shrink-0 overflow-hidden rounded-[20px]">
          <Image
            src={ABOUT.image.src}
            alt={ABOUT.image.alt}
            fill
            sizes="(max-width: 1023px) calc(100vw - 24px), 490px"
            className="object-cover"
          />
        </div>

        <div className="flex w-full max-w-[631px] flex-col gap-[44px] text-brand-dark-green">
          <div className="flex flex-col gap-[51px]">
            <h2 className="text-h2-lg">{ABOUT.heading}</h2>
            <div className="text-lead-sans flex max-w-[596px] flex-col gap-[1.4em]">
              {ABOUT.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="flex gap-[21px]">
            {ABOUT.stats.map((stat) => (
              <StatCardView
                key={stat.label}
                card={stat}
                square={false}
                trimText
                classNames={{
                  root: 'grid h-[156px] w-[174px] rounded-[20px] border border-brand-dark-green bg-brand-off-white text-brand-dark-green',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
