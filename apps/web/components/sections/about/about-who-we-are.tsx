import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui'
import { EXTERNAL_URLS } from '@/constants/routes'

/**
 * About — "Who We Are" sticky-scroll section. Top eyebrow row, then a sticky
 * title that gets pushed away by three colored panels stacking via
 * `position: sticky` (active on both mobile and desktop). Each panel pairs a
 * tall rounded portrait photo with a heading + body + four-row use-cases
 * table; the colored bar inside each panel is offset progressively
 * (40 / 121 / 202 px) so each previous bar peeks above the next as you scroll.
 *
 * Figma desktop 40009046:27278 (h 2131); mobile 40009046:27138 (h 2061).
 */
export async function AboutWhoWeAre() {
  const t = await getTranslations('pages.about.whoWeAre')

  const useCases: { label: string; body: string }[] = [
    { label: t('useCase1Label'), body: t('useCase1Body') },
    { label: t('useCase2Label'), body: t('useCase2Body') },
    { label: t('useCase3Label'), body: t('useCase3Body') },
    { label: t('useCase4Label'), body: t('useCase4Body') },
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white">
      {/* Top eyebrow row — cropped photo fragment top-left, eyebrow + tagline */}
      <div className="relative h-[80px] md:h-[86px]">
        {/* Cropped photo fragment (re-uses the builders-hub hero asset). */}
        <div className="absolute top-[11px] left-3 h-[59px] w-[84px] overflow-hidden md:h-[75px] md:w-[107px]">
          <div className="absolute -top-[28.75px] -left-[48px] h-[207.9px] w-[166.32px] md:-top-[29px] md:-left-[7px] md:h-[157px] md:w-[125px]">
            <Image
              src="/images/builders-hub/hero.webp"
              alt=""
              fill
              sizes="(min-width: 768px) 125px, 166px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        </div>
        <p className="text-eyebrow absolute top-[11px] left-[calc(50%+6.5px)] max-w-[226px] text-brand-dark-green md:left-[calc(50%+6px)]">
          {t('eyebrow')}
        </p>
        <div className="text-mono-s absolute top-[11px] right-3 hidden max-w-[303px] text-brand-dark-green md:block md:left-[calc(83.33%+2px)] md:right-auto">
          <p>{t('taglineLine1')}</p>
          <p>{t('taglineLine2')}</p>
        </div>
      </div>

      {/* Sticky title — h-167 mobile, h-474 desktop, top-68 in both */}
      <div className="sticky top-0 z-0 h-[167px] bg-brand-off-white md:h-[474px]">
        <h2 className="text-h2 absolute top-[68px] right-0 left-0 text-center text-brand-dark-green">
          {t('title')}
        </h2>
      </div>

      {/* Three stacking panels */}
      <Panel
        bg="bg-gray-01"
        image="/images/about/history.webp"
        title={t('historyTitle')}
        body={t('historyBody')}
        useCases={useCases}
        useCasesLabel={t('useCasesLabel')}
        topOffset={40}
      />
      <Panel
        bg="bg-gray-02"
        image="/images/about/principles.webp"
        title={t('principlesTitle')}
        body={
          <>
            {t('principlesBody')}
            <br />
            {t('principlesAside')}
          </>
        }
        useCases={useCases}
        useCasesLabel={t('useCasesLabel')}
        topOffset={121}
      />
      <Panel
        bg="bg-gray-03"
        image="/images/about/how-we-work.webp"
        title={t('howWeWorkTitle')}
        body={t('howWeWorkBody')}
        cta={{
          label: t('howWeWorkCta'),
          href: EXTERNAL_URLS.iftJobs,
          external: true,
        }}
        useCases={useCases}
        useCasesLabel={t('useCasesLabel')}
        topOffset={202}
      />
    </section>
  )
}

type PanelProps = {
  bg: string
  image: string
  title: string
  body: ReactNode
  useCases: { label: string; body: string }[]
  useCasesLabel: string
  cta?: { label: string; href: string; external?: boolean }
  topOffset: number
}

function Panel({
  bg,
  image,
  title,
  body,
  useCases,
  useCasesLabel,
  cta,
  topOffset,
}: PanelProps) {
  return (
    <div className="sticky top-0 h-[800px]">
      {/* Title — sticks up above the colored bar's top edge */}
      <h3
        className="text-h3-serif absolute left-3 -translate-y-full text-brand-dark-green md:left-[726px]"
        style={{ top: `${topOffset + 12}px` }}
      >
        {title}
      </h3>

      {/* Colored bar */}
      <div
        className={`${bg} absolute inset-x-0 h-[598px]`}
        style={{ top: `${topOffset}px` }}
      >
        {/* Portrait image — right on mobile, left on desktop */}
        <div className="absolute top-3 right-3 h-[151px] w-[122px] overflow-hidden rounded-[900px] md:right-auto md:left-3 md:h-[574px] md:w-[464px]">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 768px) 464px, 122px"
            className="object-cover"
          />
        </div>

        {/* Body */}
        <p className="text-mono-s absolute top-[229px] left-3 w-[345px] text-brand-dark-green md:top-[26px] md:left-[1083px] md:w-[345px]">
          {body}
        </p>

        {/* Optional CTA (under body) */}
        {cta ? (
          <Button
            href={cta.href}
            variant="link"
            className="absolute top-[484px] left-3 md:top-[78px] md:left-[1083px]"
            {...(cta.external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {cta.label}
          </Button>
        ) : null}

        {/* Use Cases — bottom area, "Use Cases" label centered above */}
        <div className="absolute bottom-3 left-3 w-[368px] md:bottom-0 md:left-[726px] md:w-[702px]">
          <p className="text-eyebrow text-brand-dark-green md:pl-[357px]">
            {useCasesLabel}
          </p>
          <ul className="mt-7 flex flex-col gap-3">
            {useCases.map((row) => (
              <li
                key={row.label}
                className="flex gap-3 border-t border-brand-dark-green/50 pt-1.5"
              >
                <span className="text-eyebrow w-[178px] text-brand-dark-green md:w-[345px]">
                  {row.label}
                </span>
                <span className="text-mono-s w-[178px] text-brand-dark-green md:flex-1">
                  {row.body}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
