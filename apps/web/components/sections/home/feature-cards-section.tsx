'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import ContentWidth from '@/components/layout/content-width'
import { LogosMark } from '@acid-info/logos-ui'

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
      className="group/path-card relative block h-[422px] w-[calc(100vw-24px)] max-w-[369px] shrink-0 cursor-pointer overflow-hidden rounded-3xl bg-brand-dark-green text-brand-off-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green min-[1025px]:w-auto min-[1025px]:max-w-none"
    >
      <Image
        src={card.image}
        alt=""
        fill
        sizes="(max-width: 768px) 369px, 464px"
        className={`object-cover transition-transform duration-700 ease-out group-hover/path-card:scale-[1.01] ${card.imageClassName ?? ''}`}
      />
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out group-hover/path-card:opacity-80 ${card.overlay}`}
      />

      <div className="absolute top-6 left-6 flex max-w-[calc(100%-170px)] items-start gap-2.5 min-[1025px]:left-[clamp(16px,1.7vw,24px)] min-[1025px]:max-w-[calc(100%-150px)] min-[1440px]:left-6 min-[1440px]:max-w-[calc(100%-170px)]">
        <LogosMark size={26} className="mt-0.5 shrink-0" />
        <h3 className="text-h3-serif min-[1025px]:text-[clamp(28px,2.5vw,36px)] min-[1440px]:text-[36px]">
          {card.title}
        </h3>
      </div>

      <span
        className="absolute top-3 right-3 inline-flex items-center justify-center rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green backdrop-blur-[5px] transition-colors duration-300 ease-out group-hover/path-card:bg-accent-steel-teal group-focus-visible/path-card:bg-accent-steel-teal min-[1025px]:px-[clamp(8px,0.8vw,12px)] min-[1440px]:px-3"
      >
        <span className="inline-flex items-center gap-1">
          <span className="font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase min-[1025px]:text-[clamp(8px,0.7vw,10px)] min-[1440px]:text-[10px]">
            {card.cta}
          </span>
          <ButtonArrowIcon />
        </span>
      </span>

      <p className="absolute right-6 bottom-6 left-6 font-sans text-[14px] leading-[1.2] font-medium min-[1025px]:right-[clamp(16px,1.7vw,24px)] min-[1025px]:left-[clamp(16px,1.7vw,24px)] min-[1025px]:text-[clamp(12px,1vw,14px)] min-[1440px]:right-6 min-[1440px]:left-6 min-[1440px]:text-[14px]">
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
      href: ROUTES.buildersHub,
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
    <section className="hidden border-t border-brand-dark-green/10 bg-brand-off-white min-[1025px]:block">
      <ContentWidth className="relative h-[848px]">
        <p className="text-mono-s absolute top-[23px] left-1/2 w-[226px] translate-x-[6px] text-left text-brand-dark-green">
          {t('kicker')}
        </p>

        <h2 className="text-h2 absolute top-[123px] left-1/2 w-full -translate-x-1/2 text-center text-brand-dark-green">
          {t('title')}
        </h2>

        <p className="text-mono-s absolute top-[229px] left-1/2 w-[230px] translate-x-[6px] text-left text-brand-dark-green">
          {t('body')}
        </p>

        <div
          className="absolute inset-x-3 top-[371px] flex gap-3 overflow-x-auto pr-3 min-[1025px]:grid min-[1025px]:grid-cols-3 min-[1025px]:overflow-visible min-[1025px]:pr-0"
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
