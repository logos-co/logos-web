import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { ROUTE_AVAILABILITY } from '@/constants/route-availability'
import AboutScrollStack, { type AboutProblemCard } from './about-scroll-stack'

function ProblemCardView({
  card,
  className,
}: {
  card: AboutProblemCard
  className?: string
}) {
  return (
    <article
      className={`grid min-h-[760px] gap-3 rounded-[18px] p-1.5 lg:h-[434px] lg:min-h-0 lg:grid-cols-2 ${card.tone} ${card.textTone} ${className ?? ''}`}
    >
      <div className="relative min-h-[333px] overflow-hidden rounded-xl lg:min-h-[422px]">
        <Image
          src={card.image}
          alt=""
          fill
          sizes="(max-width: 768px) 333px, 50vw"
          className={`object-cover ${card.imageClassName ?? ''}`}
        />
      </div>

      <div className="flex min-h-0 flex-col justify-between gap-8">
        <div className="grid gap-3 px-1.5 py-3 lg:grid-cols-2">
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

  const cards: AboutProblemCard[] = [
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
    'top-[calc(100vh+0px)]',
    'top-[calc(100vh+920px)]',
    'top-[calc(100vh+1840px)]',
    'top-[calc(100vh+2760px)]',
  ]
  const closingParagraphs = [t('closing1'), t('closing2'), t('closing3')].filter(
    (paragraph) => paragraph.trim().length > 0,
  )

  return (
    <section
      id="about"
      className="relative h-[calc(100vh+4266px)] overflow-hidden rounded-[48px] bg-brand-dark-green text-brand-off-white lg:h-auto lg:overflow-visible lg:rounded-[100px]"
    >
      <div className="lg:hidden">
        <div className="absolute top-0 left-0 flex h-screen w-full items-center justify-center px-3">
          <p className="text-h3-serif w-full max-w-[369px] text-center">
            {t('intro')}
          </p>
        </div>

        <div className="absolute top-[100vh] left-0 h-[3507px] w-full bg-brand-dark-green" />

        {cards.map((card, index) => {
          return (
            <ProblemCardView
              key={card.key}
              card={card}
              className={`absolute left-1/2 w-[calc(100%-48px)] max-w-[345px] -translate-x-1/2 ${mobileTopClasses[index]}`}
            />
          )
        })}
      </div>

      <AboutScrollStack intro={t('intro')} cards={cards} />

      <ContentWidth className="absolute top-[calc(100vh+3713px)] left-1/2 flex w-[calc(100%-24px)] -translate-x-1/2 flex-col items-center gap-15 text-center lg:relative lg:top-auto lg:left-auto lg:flex lg:w-full lg:translate-x-0 lg:pt-30 lg:pb-90">
        <div className="text-h3-serif flex max-w-[369px] flex-col gap-[1em] md:max-w-[680px] lg:max-w-[860px]">
          {closingParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {ROUTE_AVAILABILITY.about ? (
          <Button
            href={ROUTES.about}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green transition-opacity hover:opacity-80"
          >
            {t('cta')}
          </Button>
        ) : null}
      </ContentWidth>
    </section>
  )
}
