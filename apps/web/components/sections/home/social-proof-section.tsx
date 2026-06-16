'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import type { SocialProofStats } from '@/lib/social-proof-stats'

interface StatCard {
  key: 'contributions' | 'nodeOperators' | 'circles' | 'winnableIssues'
  value: string
  label: string
  body: string
}

function StatCardView({ card }: { card: StatCard }) {
  return (
    <article className="flex h-[250px] w-full flex-col gap-[23px] rounded-[20px] border border-brand-dark-green bg-brand-off-white p-5 text-brand-dark-green">
      <span className="inline-flex w-fit items-center rounded-[4px] border border-brand-dark-green px-[11px] py-1.5">
        <span className="font-sans text-[12px] leading-[1.15] tracking-[-0.01em]">
          {card.label}
        </span>
      </span>

      <p className="font-display text-[80px] leading-[1.15] tracking-[-0.01em]">
        {card.value}
      </p>

      <div className="mt-auto h-px w-full bg-brand-dark-green/30" />

      <p className="font-sans text-[15px] leading-[1.15] tracking-[-0.01em]">
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

  const cards: StatCard[] = [
    {
      key: 'contributions',
      value: stats.contributions,
      label: t('contributions.label'),
      body: t('contributions.body'),
    },
    {
      key: 'nodeOperators',
      value: '226',
      label: t('nodeOperators.label'),
      body: t('nodeOperators.body'),
    },
    {
      key: 'circles',
      value: '47',
      label: t('circles.label'),
      body: t('circles.body'),
    },
    {
      key: 'winnableIssues',
      value: '13',
      label: t('winnableIssues.label'),
      body: t('winnableIssues.body'),
    },
  ]

  return (
    <section className="relative z-[2] -mt-[60px] overflow-hidden rounded-t-[36px] bg-brand-off-white">
      <div className="mx-auto max-w-[1440px] px-3">
        <div className="flex flex-col items-center gap-9 pt-[72px] pb-[64px] text-center lg:pt-[112px] lg:pb-[102px]">
          <h2 className="text-h2 max-w-[853px] text-brand-dark-green">
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

        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 pb-[112px] lg:grid lg:grid-cols-4 lg:gap-4">
          {cards.map((card) => (
            <StatCardView key={card.key} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
