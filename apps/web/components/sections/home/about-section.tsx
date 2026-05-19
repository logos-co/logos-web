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

function ProblemCardView({ card }: { card: ProblemCard }) {
  return (
    <article
      className={`grid min-h-[720px] gap-3 rounded-[18px] p-1.5 md:min-h-[434px] md:grid-cols-[minmax(0,698px)_minmax(0,696px)] ${card.tone} ${card.textTone}`}
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

  return (
    <section
      id="about"
      className="h-[5195px] overflow-hidden rounded-[48px] bg-brand-dark-green px-3 py-24 text-brand-off-white md:h-[4074px] md:rounded-[100px] md:py-0"
    >
      <div className="mx-auto max-w-[1416px]">
        <div className="flex min-h-[520px] items-center justify-center md:min-h-[709px]">
          <p className="text-h3-serif max-w-[940px] text-center">
            {t('intro')}
          </p>
        </div>

        <div className="flex flex-col gap-12 md:gap-20">
          {cards.map((card) => (
            <ProblemCardView key={card.key} card={card} />
          ))}
        </div>

        <div className="mx-auto flex max-w-[940px] flex-col items-center gap-[60px] py-36 text-center md:py-60">
          <div className="text-h3-serif flex flex-col gap-9">
            <p>{t('closing1')}</p>
            <p>{t('closing2')}</p>
            <p>{t('closing3')}</p>
          </div>

          <Button
            href={ROUTES.about}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green transition-opacity hover:opacity-80"
          >
            {t('cta')}
          </Button>
        </div>
      </div>
    </section>
  )
}
