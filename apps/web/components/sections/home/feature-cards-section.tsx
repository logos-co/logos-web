'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { LogosMark } from '@acid-info/logos-ui'

import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

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
    <article className="relative h-[422px] overflow-hidden rounded-3xl bg-brand-dark-green text-brand-off-white">
      <Image
        src={card.image}
        alt=""
        fill
        sizes="(max-width: 768px) 369px, 464px"
        className={`object-cover ${card.imageClassName ?? ''}`}
      />
      <div className={`absolute inset-0 ${card.overlay}`} />

      <div className="absolute top-6 left-6 flex items-start gap-2.5">
        <LogosMark size={26} className="mt-0.5 shrink-0" />
        <h3 className="text-h3-serif">{card.title}</h3>
      </div>

      <Button
        href={card.href}
        className="absolute top-3 right-3 cursor-pointer bg-brand-off-white text-brand-dark-green transition-opacity hover:opacity-80"
      >
        {card.cta}
      </Button>

      <p className="absolute right-6 bottom-6 left-6 font-sans text-[14px] leading-[1.2] font-medium">
        {card.body}
      </p>
    </article>
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
    <section className="relative hidden h-[848px] border-t border-brand-dark-green/10 bg-brand-off-white md:block">
      <div className="mx-auto max-w-354">
        <p className="text-mono-s absolute top-6 left-[calc(50%+6px)] w-[226px] text-brand-dark-green">
          {t('kicker')}
        </p>

        <h2 className="text-h2 absolute top-[124px] left-1/2 w-[400px] -translate-x-1/2 text-center text-brand-dark-green">
          {t('title')}
        </h2>

        <p className="text-mono-s absolute top-[230px] left-[calc(50%+6px)] w-[230px] text-brand-dark-green">
          {t('body')}
        </p>

        <div className="absolute top-[372px] left-1/2 grid w-[1416px] -translate-x-1/2 grid-cols-3 gap-3">
          {cards.map((card) => (
            <PathCardView key={card.key} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
