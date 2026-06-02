import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { EXTERNAL_URLS } from '@/constants/routes'

/**
 * About — "Who We Are" sticky-scroll section. Top eyebrow row, then a sticky
 * title that gets pushed away by three colored panels stacking via
 * `position: sticky`. Each panel pairs a tall rounded portrait photo with a
 * heading + body + four-row use-cases table; the colored bar inside each panel
 * is offset progressively (40 / 121 / 202 px) so each previous bar peeks above
 * the next as you scroll.
 *
 * Layout is split into a mobile subtree (`md:hidden`, absolute positioning) and
 * a desktop subtree (`hidden md:grid`, a fluid 12-column grid). The Figma 1440
 * desktop frame maps cleanly to a 12-col grid (col ≈ 107px, gap 12px), so the
 * grid reproduces the 1440 design while scaling fluidly across 768–1440px+
 * instead of overflowing at every width below 1440px.
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
        <div className="absolute top-[11px] left-3 z-10 h-[59px] w-[84px] overflow-hidden md:h-[75px] md:w-[107px]">
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

        <ContentWidth className="grid h-full grid-cols-12 gap-3">
          <p className="text-eyebrow col-span-6 col-start-7 pt-[11px] text-brand-dark-green md:col-span-3">
            {t('eyebrow')}
          </p>
          <div className="text-mono-s col-span-3 col-start-10 hidden pt-[11px] text-brand-dark-green md:block">
            <p>{t('taglineLine1')}</p>
            <p>{t('taglineLine2')}</p>
          </div>
        </ContentWidth>
      </div>

      {/* Sticky title — h-167 mobile, h-252 desktop, top-68 in both */}
      <div className="sticky top-0 z-0 h-[167px] bg-brand-off-white md:h-[252px]">
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

type UseCase = { label: string; body: string }

type PanelProps = {
  bg: string
  image: string
  title: string
  body: ReactNode
  useCases: UseCase[]
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
  const ctaProps = cta?.external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <div className="sticky top-0 h-[800px]">
      {/* Colored bar */}
      <div
        className={`${bg} absolute inset-x-0 h-[598px]`}
        style={{ top: `${topOffset}px` }}
      >
        {/* Centered 1440 frame for the bar's content */}
        <ContentWidth className="relative h-full">
          {/* ---- Mobile layout (absolute, < md) ---- */}
          <div className="md:hidden">
            <h3 className="text-h3-serif absolute top-[52px] left-3 -translate-y-full text-brand-dark-green">
              {title}
            </h3>

            <div className="absolute top-3 right-3 h-[151px] w-[122px] overflow-hidden rounded-[900px]">
              <Image
                src={image}
                alt=""
                fill
                sizes="122px"
                className="object-cover"
              />
            </div>

            <p className="text-mono-s absolute top-[229px] left-3 w-[calc(100%-24px)] max-w-[345px] text-brand-dark-green">
              {body}
            </p>

            {cta ? (
              <Button
                href={cta.href}
                variant="link"
                className="absolute top-[484px] left-3"
                {...ctaProps}
              >
                {cta.label}
              </Button>
            ) : null}

            <div className="absolute bottom-3 left-3 w-[calc(100%-24px)] max-w-[368px]">
              <p className="text-eyebrow text-brand-dark-green">
                {useCasesLabel}
              </p>
              <ul className="mt-7 flex flex-col gap-3">
                {useCases.map((row) => (
                  <li
                    key={row.label}
                    className="grid grid-cols-2 gap-3 border-t border-brand-dark-green/50 pt-1.5"
                  >
                    <span className="text-eyebrow min-w-0 text-brand-dark-green">
                      {row.label}
                    </span>
                    <span className="text-mono-s min-w-0 text-brand-dark-green">
                      {row.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ---- Desktop layout (fluid 12-col grid, ≥ md) ---- */}
          <div className="hidden h-full grid-cols-12 gap-3 md:grid">
            {/* Portrait — cols 1-4, full bar height */}
            <div className="relative col-span-4 overflow-hidden rounded-[900px]">
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1440px) 464px, 33vw"
                className="object-cover"
              />
            </div>

            {/* Right region — cols 7-12: title + body/cta on top, use cases bottom */}
            <div className="col-span-6 col-start-7 flex h-full flex-col">
              <div className="grid grid-cols-6 gap-3">
                <h3 className="text-h3-serif col-span-3 pt-4 text-brand-dark-green">
                  {title}
                </h3>
                <div className="col-span-3 col-start-4 flex flex-col gap-3 pt-6.5">
                  <p className="text-mono-s text-brand-dark-green">{body}</p>
                  {cta ? (
                    <Button
                      href={cta.href}
                      variant="link"
                      className="self-start"
                      {...ctaProps}
                    >
                      {cta.label}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-auto pb-3">
                <div className="grid grid-cols-6 gap-3">
                  <p className="text-eyebrow col-span-3 col-start-4 text-brand-dark-green">
                    {useCasesLabel}
                  </p>
                </div>
                <ul className="mt-7 flex flex-col gap-3">
                  {useCases.map((row) => (
                    <li
                      key={row.label}
                      className="grid grid-cols-6 gap-3 border-t border-brand-dark-green/50 pt-1.5"
                    >
                      <span className="text-eyebrow col-span-3 min-w-0 text-brand-dark-green">
                        {row.label}
                      </span>
                      <span className="text-mono-s col-span-3 min-w-0 text-brand-dark-green">
                        {row.body}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </ContentWidth>
      </div>
    </div>
  )
}
