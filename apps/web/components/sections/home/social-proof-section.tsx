'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import {
  getSocialProofCards,
  type HomeStatCard,
} from '@/lib/homepage-section-data'
import type { SocialProofStats } from '@/lib/social-proof-stats'

function StatCardView({ card }: { card: HomeStatCard }) {
  return (
    <article className="hidden min-h-[250px] w-full min-w-0 flex-col gap-[23px] rounded-[20px] border border-brand-dark-green bg-brand-off-white p-5 text-brand-dark-green md:flex">
      <span className="inline-flex w-fit items-center rounded-[4px] border border-brand-dark-green px-[11px] py-1.5">
        <span className="font-sans text-[12px] leading-[1.15] tracking-[-0.01em]">
          {card.label}
        </span>
      </span>

      <p className="font-display text-[80px] leading-[1.15] tracking-[-0.01em]">
        {card.value}
      </p>

      <p className="mt-auto max-w-full min-w-0 font-sans text-[15px] leading-[1.15] tracking-[-0.01em] [overflow-wrap:anywhere]">
        {card.body}
      </p>
    </article>
  )
}

function MobileStatRowView({
  card,
  showTopRule,
}: {
  card: HomeStatCard
  showTopRule: boolean
}) {
  return (
    <article className="flex w-full flex-col items-center justify-center gap-6 md:hidden">
      {showTopRule ? <div className="h-px w-full bg-[#D8DDD7]" /> : null}
      <div className="flex h-[45px] w-[288px] flex-col items-center justify-center gap-3 text-center text-brand-dark-green [word-break:break-word]">
        <p className="w-full font-sans text-[18px] leading-[1.15] font-normal tracking-[-0.18px] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          {card.value} {card.label}
        </p>
        <p className="font-mono-body w-full text-[10px] leading-[1.3] font-normal tracking-normal [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          {card.body}
        </p>
      </div>
      <div className="h-px w-full bg-[#D8DDD7]" />
    </article>
  )
}

interface SocialProofSectionProps {
  stats: SocialProofStats
}

export default function SocialProofSection({ stats }: SocialProofSectionProps) {
  const t = useTranslations('home.socialProof')
  const cards = getSocialProofCards(stats, t)

  return (
    <section className="relative z-[2] -mt-[60px] overflow-hidden rounded-t-[36px] bg-brand-off-white">
      <div className="mx-auto max-w-[1440px] px-3">
        <div className="flex flex-col items-center gap-6 pt-[112px] pb-[112px] text-center md:gap-9 md:pt-[72px] md:pb-[64px] lg:pt-[112px] lg:pb-[102px]">
          <h2 className="w-[351.5px] max-w-[calc(100vw-50.5px)] text-center font-display text-[24px] leading-none tracking-[-0.72px] whitespace-pre-wrap text-brand-dark-green [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] md:w-full md:max-w-[853px] md:text-[56px] md:tracking-[-0.03em]">
            <span className="block">{t('headline1')}</span>
            <span className="block text-[#848e88]">{t('headline2')}</span>
          </h2>
          <Button
            href={ROUTES.manifesto}
            className="h-[31px] w-[151px] cursor-pointer rounded-[4px] px-3 py-2 transition-opacity hover:opacity-80 [&>span]:gap-1 md:h-auto md:w-auto md:rounded-xl md:[&>span]:gap-1.5"
          >
            {t('manifestoCta')}
          </Button>
        </div>

        <div className="relative left-1/2 mb-[112px] grid w-screen max-w-none min-w-0 -translate-x-1/2 grid-cols-1 gap-6 pb-0 md:static md:left-auto md:mx-auto md:mb-0 md:w-full md:max-w-[1180px] md:translate-x-0 md:grid-cols-2 md:gap-3 md:pb-[112px] xl:grid-cols-4 xl:gap-4">
          {cards.map((card, index) => (
            <MobileStatRowView
              key={`${card.key}-mobile`}
              card={card}
              showTopRule={index === 0}
            />
          ))}
          {cards.map((card) => (
            <StatCardView key={card.key} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
