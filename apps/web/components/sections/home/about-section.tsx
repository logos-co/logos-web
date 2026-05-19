import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

interface ProblemCard {
  key: 'debt' | 'surveillance' | 'corruption' | 'stagnation'
  title: string
  body: string
  facts: string[]
  image: string
  tone: string
  textTone: string
  imageClassName?: string
}

function ProblemCardView({
  card,
  className,
}: {
  card: ProblemCard
  className?: string
}) {
  return (
    <article
      className={`grid h-[720px] gap-3 rounded-[18px] p-1.5 md:h-[434px] md:grid-cols-[minmax(0,698px)_minmax(0,696px)] ${card.tone} ${card.textTone} ${className ?? ''}`}
    >
      <div className="relative min-h-[333px] overflow-hidden rounded-xl md:min-h-[422px]">
        <Image
          src={card.image}
          alt=""
          fill
          sizes="(max-width: 768px) 333px, 698px"
          className={`object-cover ${card.imageClassName ?? ''}`}
        />
      </div>

      <div className="flex min-h-0 flex-col justify-between gap-8">
        <div className="grid gap-3 px-1.5 py-3 md:grid-cols-2">
          <h3 className="text-h3-serif">{card.title}</h3>
          <p className="font-sans text-[14px] leading-[1.2]">{card.body}</p>
        </div>

        <div className="flex flex-col gap-3 px-1.5 py-3">
          {card.facts.map((fact) => (
            <p
              key={fact}
              className="border-t border-current/50 pt-1.5 font-mono text-[10px] leading-[1.3]"
            >
              {fact}
            </p>
          ))}
        </div>
      </div>
    </article>
  )
}

export default async function AboutSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.about' })

  const cards: ProblemCard[] = [
    {
      key: 'debt',
      title: t('problems.debt.title'),
      body: t('problems.debt.body'),
      facts: [
        t('problems.debt.fact1'),
        t('problems.debt.fact2'),
        t('problems.debt.fact3'),
        t('problems.debt.fact4'),
      ],
      image: '/images/home/figma-refresh/problem-debt.webp',
      tone: 'bg-[#475651]',
      textTone: 'text-brand-off-white',
    },
    {
      key: 'surveillance',
      title: t('problems.surveillance.title'),
      body: t('problems.surveillance.body'),
      facts: [
        t('problems.surveillance.fact1'),
        t('problems.surveillance.fact2'),
        t('problems.surveillance.fact3'),
      ],
      image: '/images/home/figma-refresh/problem-surveillance.webp',
      tone: 'bg-[#616e69]',
      textTone: 'text-brand-off-white',
      imageClassName: 'object-[50%_42%]',
    },
    {
      key: 'corruption',
      title: t('problems.corruption.title'),
      body: t('problems.corruption.body'),
      facts: [
        t('problems.corruption.fact1'),
        t('problems.corruption.fact2'),
        t('problems.corruption.fact3'),
      ],
      image: '/images/home/figma-refresh/problem-corruption.webp',
      tone: 'bg-[#848e88]',
      textTone: 'text-brand-off-white',
    },
    {
      key: 'stagnation',
      title: t('problems.stagnation.title'),
      body: t('problems.stagnation.body'),
      facts: [t('problems.stagnation.fact1'), t('problems.stagnation.fact2')],
      image: '/images/home/figma-refresh/problem-stagnation.webp',
      tone: 'bg-[#9ea5a0]',
      textTone: 'text-brand-dark-green',
      imageClassName: 'object-[50%_45%]',
    },
  ]
  const mobileTopClasses = [
    'top-[929px]',
    'top-[1849px]',
    'top-[2769px]',
    'top-[3689px]',
  ]
  const desktopTopClasses = [
    'md:top-[969px]',
    'md:top-[1489px]',
    'md:top-[2009px]',
    'md:top-[2529px]',
  ]

  return (
    <section
      id="about"
      className="relative h-[5195px] overflow-hidden rounded-[48px] bg-brand-dark-green text-brand-off-white md:h-[4074px] md:rounded-[100px]"
    >
      <p className="text-h3-serif absolute top-[360px] left-1/2 w-[369px] -translate-x-1/2 text-center md:top-[342px] md:w-[940px]">
        {t('intro')}
      </p>

      <div className="absolute top-[936px] left-0 h-[3507px] w-full bg-brand-dark-green md:top-[1323px] md:left-3 md:h-[1964px] md:w-[calc(100%-24px)]" />

      {cards.map((card, index) => {
        return (
          <ProblemCardView
            key={card.key}
            card={card}
            className={`absolute left-[24px] w-[345px] md:left-3 md:w-[1416px] ${mobileTopClasses[index]} ${desktopTopClasses[index]}`}
          />
        )
      })}

      <div className="absolute top-[4642px] left-3 flex w-[369px] flex-col items-center gap-[60px] text-center md:top-[3508px] md:left-1/2 md:w-[940px] md:-translate-x-1/2">
        <p className="text-h3-serif">
          {t('closing1')} {t('closing2')} {t('closing3')}
        </p>

        <Button
          href={ROUTES.about}
          className="cursor-pointer bg-brand-off-white text-brand-dark-green transition-opacity hover:opacity-80"
        >
          {t('cta')}
        </Button>
      </div>
    </section>
  )
}
