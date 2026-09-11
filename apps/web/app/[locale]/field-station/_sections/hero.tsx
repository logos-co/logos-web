import Image from 'next/image'

import { CampaignHero } from '@/components/sections/shared/campaign-hero'
import { Button } from '@/components/ui'

import { APPLY_HREF, EVENT_NAMES, HERO } from '../_content'

/** Same mono label style as the site's CTA buttons. */
const CTA_TEXT_CLASSNAME =
  'font-mono text-xs leading-[1.35] font-semibold uppercase'

/**
 * Figma pins the copy block 186.5px from the top of the 800px frame and the
 * link row 48px from the bottom; the image runs 8px past the right edge, so
 * only its left corners show as rounded.
 */
export function Hero() {
  return (
    <CampaignHero
      classNames={{
        root: 'relative min-h-[800px] overflow-hidden bg-brand-off-white px-3 pt-10 text-brand-off-white md:h-[800px]',
        content:
          'relative z-10 flex min-h-[760px] flex-col items-center pt-20 pb-[46px] md:h-full md:min-h-0 md:pt-[146.5px]',
        column: 'flex w-full max-w-[530px] flex-col items-center text-center',
      }}
      background={
        <div className="absolute inset-y-0 left-0 w-[calc(100%+8px)] overflow-hidden rounded-[20px]">
          <Image
            src={HERO.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-linear-[46.88deg] from-black/60 from-[45.238%] to-black/0 to-[77.486%]" />
        </div>
      }
      footer={
        <nav
          aria-label="Page sections"
          className={`mt-auto flex w-full max-w-[432px] flex-wrap justify-center gap-x-6 gap-y-3 pt-12 md:justify-between md:gap-0 ${CTA_TEXT_CLASSNAME}`}
        >
          {HERO.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-umami-event-name={EVENT_NAMES.heroSectionLink(link.label)}
              className="cursor-pointer transition-opacity hover:opacity-70"
            >
              {link.label}
            </a>
          ))}
        </nav>
      }
    >
      <h1 className="text-h2 leading-[0.88]! [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
        <span className="text-h5-serif">{HERO.label}</span>
        <br />
        {HERO.heading}
      </h1>
      <div className="text-body-sans mt-[42px] flex w-full max-w-[462px] flex-col gap-[1.2em]">
        {HERO.body.map((group) => (
          <div key={group[0]}>
            {group.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>
      <Button
        href={APPLY_HREF}
        data-umami-event-name={EVENT_NAMES.heroApply}
        className="mt-[57.8px] w-full max-w-[432px] cursor-pointer border border-white bg-brand-off-white text-brand-dark-green"
      >
        {HERO.cta}
      </Button>
      <p className={`mt-[26.5px] ${CTA_TEXT_CLASSNAME}`}>{HERO.status}</p>
    </CampaignHero>
  )
}
