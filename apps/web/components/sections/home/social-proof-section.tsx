'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface SocialProofCard {
  key: 'contributions' | 'nodes' | 'circles' | 'issues'
  value: string
  label: string
  body: string
  image: string
  mobileClassName?: string
  imageClassName?: string
}

function SocialProofCardView({
  card,
}: {
  card: SocialProofCard
}) {
  return (
    <article
      className={`relative flex w-full shrink-0 flex-col overflow-hidden rounded-3xl p-1.5 md:h-[432px] ${card.mobileClassName ?? 'h-[411px]'}`}
    >
      <Image
        src={card.image}
        alt=""
        fill
        sizes="(max-width: 768px) 369px, 25vw"
        className={`object-cover ${card.imageClassName ?? ''}`}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative flex h-[333px] flex-col items-center justify-center gap-9 rounded-[18px] px-[18px] text-center text-brand-off-white">
        <p className="font-display text-[112px] leading-none tracking-[-0.04em] md:text-[140px]">
          {card.value}
        </p>
        <p className="font-sans text-[24px] leading-[1.1] tracking-[-0.01em]">
          {card.label}
        </p>
      </div>

      <div className="relative mt-auto rounded-[18px] bg-brand-off-white p-3 text-brand-dark-green">
        <p className="font-sans text-[18px] leading-[1.15] tracking-[-0.01em]">
          {card.body}
        </p>
      </div>
    </article>
  )
}

export default function SocialProofSection() {
  const t = useTranslations('home.socialProof')

  const cards: SocialProofCard[] = [
    {
      key: 'contributions',
      value: t('contributions.value'),
      label: t('contributions.label'),
      body: t('contributions.body'),
      image: '/images/home/figma-refresh/social-contributions.webp',
      mobileClassName: 'h-[411px]',
      imageClassName: 'object-[47%_52%]',
    },
    {
      key: 'nodes',
      value: t('nodes.value'),
      label: t('nodes.label'),
      body: t('nodes.body'),
      image: '/images/home/figma-refresh/social-node.webp',
      mobileClassName: 'h-[432px]',
      imageClassName: 'object-[50%_52%]',
    },
    {
      key: 'circles',
      value: t('circles.value'),
      label: t('circles.label'),
      body: t('circles.body'),
      image: '/images/home/figma-refresh/social-circles.webp',
      mobileClassName: 'h-[411px]',
      imageClassName: 'object-[50%_50%]',
    },
    {
      key: 'issues',
      value: t('issues.value'),
      label: t('issues.label'),
      body: t('issues.body'),
      image: '/images/home/figma-refresh/social-issues.webp',
      mobileClassName: 'h-[432px]',
      imageClassName: 'object-[47%_51%]',
    },
  ]

  return (
    <section className="relative z-[2] -mt-10 overflow-hidden rounded-t-[36px] bg-brand-off-white px-3 pt-3 pb-[100px]">
      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <SocialProofCardView key={card.key} card={card} />
        ))}
      </div>
    </section>
  )
}
