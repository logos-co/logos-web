'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import type { SocialProofStats } from '@/lib/social-proof-stats'

interface SocialProofCard {
  key: 'contributions' | 'contributors' | 'repositories' | 'circles'
  value: string
  label: string
  body: string
  image: string
  mobileClassName?: string
  imageClassName?: string
}

function SocialProofCardView({ card }: { card: SocialProofCard }) {
  return (
    <article
      className={`relative flex w-full flex-col overflow-hidden rounded-3xl p-1.5 lg:h-[432px] ${card.mobileClassName ?? 'h-[411px]'}`}
    >
      <Image
        src={card.image}
        alt=""
        fill
        sizes="(max-width: 1024px) calc(100vw - 24px), 25vw"
        className={`object-cover ${card.imageClassName ?? ''}`}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative flex h-[333px] flex-col items-center justify-center gap-9 rounded-[18px] px-4.5 text-center text-brand-off-white">
        <p className="font-display text-[112px] leading-none tracking-[-0.04em] lg:text-[clamp(78px,9vw,140px)] desktop:text-[140px]">
          {card.value}
        </p>
        <p className="font-sans text-[24px] leading-[1.1] tracking-[-0.01em] lg:text-[clamp(18px,1.75vw,24px)] desktop:text-[24px]">
          {card.label}
        </p>
      </div>

      <div className="relative mt-auto rounded-[18px] bg-brand-off-white p-3 text-brand-dark-green">
        <p className="font-sans text-[18px] leading-[1.15] tracking-[-0.01em] lg:text-[clamp(14px,1.25vw,18px)] desktop:text-[18px]">
          {card.body}
        </p>
      </div>
    </article>
  )
}

interface SocialProofSectionProps {
  stats: SocialProofStats
}

export default function SocialProofSection({ stats }: SocialProofSectionProps) {
  const t = useTranslations('home.socialProof')

  const cards: SocialProofCard[] = [
    {
      key: 'contributions',
      value: stats.contributions,
      label: t('contributions.label'),
      body: t('contributions.body'),
      image: '/images/home/figma-refresh/social-contributions.webp',
      mobileClassName: 'h-[411px]',
      imageClassName: 'object-[47%_52%]',
    },
    {
      key: 'contributors',
      value: stats.contributors,
      label: t('contributors.label'),
      body: t('contributors.body'),
      image: '/images/home/figma-refresh/social-node.webp',
      mobileClassName: 'h-[432px]',
      imageClassName: 'object-[50%_52%]',
    },
    {
      key: 'repositories',
      value: stats.repositories,
      label: t('repositories.label'),
      body: t('repositories.body'),
      image: '/images/home/figma-refresh/social-issues.webp',
      mobileClassName: 'h-[411px]',
      imageClassName: 'object-[47%_51%]',
    },
    {
      key: 'circles',
      value: stats.circles,
      label: t('circles.label'),
      body: t('circles.body'),
      image: '/images/home/figma-refresh/social-circles.webp',
      mobileClassName: 'h-[432px]',
      imageClassName: 'object-[50%_50%]',
    },
  ]

  return (
    <section className="relative z-[2] -mt-10 overflow-hidden rounded-t-[36px] bg-brand-off-white">
      <div className="px-3 pt-3 pb-25">
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-4">
          {cards.map((card) => (
            <SocialProofCardView key={card.key} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
