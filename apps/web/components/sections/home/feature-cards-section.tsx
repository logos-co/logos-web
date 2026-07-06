'use client'

import Image from 'next/image'

import type { HomeChoosePathSection } from '@repo/content/schemas'

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
      className="group/path-card relative flex aspect-square w-full shrink-0 cursor-pointer flex-col overflow-hidden rounded-3xl bg-brand-dark-green text-brand-off-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green min-[600px]:aspect-auto min-[800px]:aspect-square lg:w-auto"
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

      <div className="relative z-[1] flex items-start justify-between gap-2.5 p-3 min-[600px]:max-lg:flex-col min-[600px]:max-lg:gap-3">
        <div className="flex min-w-0 items-start gap-2.5 pt-3 pl-3">
          <LogosMark size={28} className="mt-0.5 shrink-0" />
          <h3 className="text-h3-serif lg:text-[clamp(28px,2.5vw,36px)] desktop:text-[36px]">
            {card.title}
          </h3>
        </div>

        <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green backdrop-blur-[5px] transition-colors duration-300 ease-out group-hover/path-card:bg-accent-steel-teal group-focus-visible/path-card:bg-accent-steel-teal lg:px-[clamp(8px,0.8vw,12px)] desktop:px-3">
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase lg:text-[clamp(8px,0.7vw,10px)] desktop:text-[10px]">
              {card.cta}
            </span>
            <ButtonArrowIcon />
          </span>
        </span>
      </div>

      <p className="relative z-[1] mt-auto px-6 pt-3 pb-6 font-sans text-[14px] leading-[1.2] font-medium lg:px-[clamp(16px,1.7vw,24px)] lg:pt-0 lg:text-[clamp(12px,1vw,14px)] desktop:px-6 desktop:text-[14px]">
        {card.body}
      </p>
    </Link>
  )
}

interface FeatureCardsSectionProps {
  data: HomeChoosePathSection
}

export default function FeatureCardsSection({ data }: FeatureCardsSectionProps) {
  const cards: PathCard[] = [
    {
      key: 'build',
      title: data.build.title,
      body: data.build.body,
      cta: data.build.cta,
      href: ROUTES.getStarted,
      image: '/images/home/figma-refresh/path-build.webp',
      overlay: 'bg-black/20',
      imageClassName: 'object-[50%_60%]',
    },
    {
      key: 'operate',
      title: data.operate.title,
      body: data.operate.body,
      cta: data.operate.cta,
      href: ROUTES.nodeProgramme,
      image: '/images/home/figma-refresh/path-operate.webp',
      overlay: 'bg-black/45',
      imageClassName: 'object-[45%_50%]',
    },
    {
      key: 'activism',
      title: data.activism.title,
      body: data.activism.body,
      cta: data.activism.cta,
      href: ROUTES.movement,
      image: '/images/home/figma-refresh/path-activism.webp',
      overlay: 'bg-black/45',
      imageClassName: 'object-[50%_50%]',
    },
  ]

  return (
    <section className="bg-brand-off-white">
      <ContentWidth className="relative pt-3 pb-25 lg:pt-0 lg:pb-14">
        <div className="mt-16 flex flex-col items-center gap-6 text-center lg:absolute lg:top-[112px] lg:left-1/2 lg:mt-0 lg:w-[940px] lg:max-w-[calc(100%-24px)] lg:-translate-x-1/2 lg:flex-row lg:items-start lg:justify-between lg:gap-8 lg:text-left">
          <SectionHeadingReveal className="w-[351.5px] max-w-[calc(100vw-24px)] text-center font-display text-[24px] leading-none tracking-[-0.72px] text-brand-dark-green lg:w-auto lg:max-w-none lg:text-left lg:text-h2">
            {data.title}
          </SectionHeadingReveal>

          <div className="font-mono-body mx-auto flex w-[351.5px] max-w-[calc(100vw-24px)] flex-col gap-[13px] text-[10px] leading-[1.3] text-brand-dark-green lg:mx-0 lg:w-[226px] lg:gap-4 lg:text-mono-s">
            <p>{data.kicker}</p>
            <p>{data.body}</p>
          </div>
        </div>

        <div
          className="mt-[40px] flex flex-col gap-6 min-[600px]:grid min-[600px]:grid-cols-3 min-[600px]:gap-3 lg:mt-0 lg:grid lg:grid-cols-3 lg:gap-3 lg:pt-[371px]"
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
