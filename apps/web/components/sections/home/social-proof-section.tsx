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
    <article className="flex min-h-[250px] w-full min-w-0 flex-col gap-[23px] rounded-[20px] border border-brand-dark-green bg-brand-off-white p-5 text-brand-dark-green">
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

interface SocialProofSectionProps {
  stats: SocialProofStats
}

export default function SocialProofSection({ stats }: SocialProofSectionProps) {
  const t = useTranslations('home.socialProof')
  const cards = getSocialProofCards(stats, t)

  return (
    <section className="relative z-[2] -mt-[60px] overflow-hidden rounded-t-[36px] bg-brand-off-white">
      <div className="mx-auto max-w-[1440px] px-3">
        <div className="flex flex-col items-center gap-9 pt-[72px] pb-[64px] text-center lg:pt-[112px] lg:pb-[102px]">
          <h2 className="text-h2 w-full max-w-[853px] text-brand-dark-green">
            <span className="block">{t('headline1')}</span>
            <span className="block text-[#848e88]">{t('headline2')}</span>
          </h2>
          <Button
            href={ROUTES.manifesto}
            className="cursor-pointer transition-opacity hover:opacity-80"
          >
            {t('manifestoCta')}
          </Button>
        </div>

        <div className="mx-auto grid w-full max-w-[1180px] min-w-0 grid-cols-1 gap-3 pb-[112px] md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          {cards.map((card) => (
            <StatCardView key={card.key} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
