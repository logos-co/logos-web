import { getTranslations } from 'next-intl/server'

import { ROUTES } from '@/constants/routes'
import { ROUTE_AVAILABILITY } from '@/constants/route-availability'
import AboutScrollStack, { type AboutProblemCard } from './about-scroll-stack'

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
      factLinks: {
        1: {
          label: '30% less wealth',
          href: 'https://www.cam.ac.uk/research/news/boom-and-bust-millennials-arent-all-worse-off-than-baby-boomers-but-the-rich-poor-gap-is-widening',
        },
      },
      image: '/images/home/figma-refresh/problem-debt.webp',
      tone: 'bg-gray-01',
      textTone: 'text-brand-dark-green',
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
      tone: 'bg-gray-02',
      textTone: 'text-brand-dark-green',
      factLinks: {},
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
      tone: 'bg-gray-03',
      textTone: 'text-brand-dark-green',
      factLinks: {},
    },
    {
      key: 'stagnation',
      title: t('problems.stagnation.title'),
      body: t('problems.stagnation.body'),
      facts: [t('problems.stagnation.fact1'), t('problems.stagnation.fact2')],
      image: '/images/home/figma-refresh/problem-stagnation.webp',
      tone: 'bg-gray-04',
      textTone: 'text-brand-off-white',
      factLinks: {},
      imageClassName: 'object-[50%_45%]',
    },
  ]
  const closingParagraphs = [t('closing1'), t('closing2'), t('closing3')].filter(
    (paragraph) => paragraph.trim().length > 0,
  )

  return (
    <section
      id="about"
      className="relative bg-brand-dark-green text-brand-off-white"
    >
      <AboutScrollStack
        intro={t('intro')}
        cards={cards}
        closingParagraphs={closingParagraphs}
        cta={
          ROUTE_AVAILABILITY.about ? { href: ROUTES.about, label: t('cta') } : undefined
        }
      />
    </section>
  )
}
