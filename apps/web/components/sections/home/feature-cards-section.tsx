'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import ContentWidth from '@/components/layout/content-width'
import { LogosMark } from '@acid-info/logos-ui'

import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

interface PathCard {
  key: 'build' | 'operate' | 'activism'
  title: string
  body: string
  cta: string
  href: string
  image: string
  overlay: string
  imageClassName?: string
}

function PathCardView({ card }: { card: PathCard }) {
  return (
    <Link
      href={card.href}
      className="group/path-card relative block h-[422px] w-full shrink-0 cursor-pointer overflow-hidden rounded-3xl bg-brand-dark-green text-brand-off-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green lg:w-auto"
    >
      <Image
        src={card.image}
        alt=""
        fill
        sizes="(max-width: 768px) 369px, 464px"
        className={`object-cover transition-transform duration-700 ease-out group-hover/path-card:scale-[1.08] ${card.imageClassName ?? ''}`}
      />
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out group-hover/path-card:opacity-40 ${card.overlay}`}
      />

      <div className="absolute top-6 left-6 flex max-w-[calc(100%-170px)] items-start gap-2.5 lg:left-[clamp(16px,1.7vw,24px)] lg:max-w-[calc(100%-150px)] desktop:left-6 desktop:max-w-[calc(100%-170px)]">
        <LogosMark size={28} className="mt-0.5 shrink-0" />
        <h3 className="text-h3-serif lg:text-[clamp(28px,2.5vw,36px)] desktop:text-[36px]">
          {card.title}
        </h3>
      </div>

      <span className="absolute top-3 right-3 inline-flex items-center justify-center rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green backdrop-blur-[5px] transition-colors duration-300 ease-out group-hover/path-card:bg-accent-steel-teal group-focus-visible/path-card:bg-accent-steel-teal lg:px-[clamp(8px,0.8vw,12px)] desktop:px-3">
        <span className="inline-flex items-center gap-1">
          <span className="font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase lg:text-[clamp(8px,0.7vw,10px)] desktop:text-[10px]">
            {card.cta}
          </span>
          <ButtonArrowIcon />
        </span>
      </span>

      <p className="absolute right-6 bottom-6 left-6 font-sans text-[14px] leading-[1.2] font-medium lg:right-[clamp(16px,1.7vw,24px)] lg:left-[clamp(16px,1.7vw,24px)] lg:text-[clamp(12px,1vw,14px)] desktop:right-6 desktop:left-6 desktop:text-[14px]">
        {card.body}
      </p>
    </Link>
  )
}

export default function FeatureCardsSection() {
  const t = useTranslations('home.paths')

  const cards: PathCard[] = [
    {
      key: 'build',
      title: t('build.title'),
      body: t('build.body'),
      cta: t('build.cta'),
      href: ROUTES.getStarted,
      image: '/images/home/figma-refresh/path-build.webp',
      overlay: 'bg-black/20',
      imageClassName: 'object-[50%_60%]',
    },
    {
      key: 'operate',
      title: t('operate.title'),
      body: t('operate.body'),
      cta: t('operate.cta'),
      href: ROUTES.nodeProgramme,
      image: '/images/home/figma-refresh/path-operate.webp',
      overlay: 'bg-black/45',
      imageClassName: 'object-[45%_50%]',
    },
    {
      key: 'activism',
      title: t('activism.title'),
      body: t('activism.body'),
      cta: t('activism.cta'),
      href: ROUTES.movement,
      image: '/images/home/figma-refresh/path-activism.webp',
      overlay: 'bg-black/45',
      imageClassName: 'object-[50%_50%]',
    },
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white">
      <ContentWidth className="relative pt-3 pb-25 lg:h-[848px] lg:py-0">
        <div className="mt-16 flex flex-col gap-8 text-center lg:absolute lg:top-[112px] lg:left-1/2 lg:mt-0 lg:w-[940px] lg:max-w-[calc(100%-24px)] lg:-translate-x-1/2 lg:flex-row lg:items-start lg:justify-between lg:text-left">
          <SectionHeadingReveal className="text-h2 text-brand-dark-green">
            {t('title')}
          </SectionHeadingReveal>

          <div className="text-mono-s mx-auto flex w-[230px] flex-col gap-4 text-brand-dark-green lg:mx-0 lg:w-[226px]">
            <p>{t('kicker')}</p>
            <p>{t('body')}</p>
          </div>
        </div>

        <div
          className="mt-32 flex flex-col gap-6 lg:absolute lg:inset-x-3 lg:top-[371px] lg:mt-0 lg:grid lg:grid-cols-3 lg:gap-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card) => (
            <PathCardView key={card.key} card={card} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
