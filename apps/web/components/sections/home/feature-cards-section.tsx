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
      className="group/path-card relative block h-[422px] cursor-pointer overflow-hidden rounded-3xl bg-brand-dark-green text-brand-off-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green"
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

      <div className="absolute top-6 left-6 flex items-start gap-2.5">
        <LogosMark size={26} className="mt-0.5 shrink-0" />
        <h3 className="text-h3-serif">{card.title}</h3>
      </div>

      <span
        className="absolute top-3 right-3 inline-flex items-center justify-center rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green backdrop-blur-[5px] transition-colors duration-300 ease-out group-hover/path-card:bg-accent-steel-teal group-focus-visible/path-card:bg-accent-steel-teal"
      >
        <span className="inline-flex items-center gap-1">
          <span className="font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase">
            {card.cta}
          </span>
          <ButtonArrowIcon />
        </span>
      </span>

      <p className="absolute right-6 bottom-6 left-6 font-sans text-[14px] leading-[1.2] font-medium">
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
      href: ROUTES.nodeProgram,
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
    <section className="hidden border-t border-brand-dark-green/10 bg-brand-off-white md:block">
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

        <div className="absolute inset-x-3 top-[371px] grid grid-cols-3 gap-3">
          {cards.map((card) => (
            <PathCardView key={card.key} card={card} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
