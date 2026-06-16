import { getTranslations } from 'next-intl/server'

import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { StackCard } from '@/components/motion/stack-card'
import CivilSocietyAccordion, {
  type AccordionItem,
} from './civil-society-accordion'

export default async function AboutSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.about' })

  const items: AccordionItem[] = [
    {
      key: 'debt',
      title: t('problems.debt.title'),
      subtitle: t('problems.debt.subtitle'),
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
    },
    {
      key: 'surveillance',
      title: t('problems.surveillance.title'),
      subtitle: t('problems.surveillance.subtitle'),
      body: t('problems.surveillance.body'),
      facts: [
        t('problems.surveillance.fact1'),
        t('problems.surveillance.fact2'),
        t('problems.surveillance.fact3'),
      ],
      factLinks: {},
      image: '/images/home/figma-refresh/problem-surveillance.webp',
      imageClassName: 'object-[50%_42%]',
    },
    {
      key: 'corruption',
      title: t('problems.corruption.title'),
      subtitle: t('problems.corruption.subtitle'),
      body: t('problems.corruption.body'),
      facts: [
        t('problems.corruption.fact1'),
        t('problems.corruption.fact2'),
        t('problems.corruption.fact3'),
      ],
      factLinks: {},
      image: '/images/home/figma-refresh/problem-corruption.webp',
    },
    {
      key: 'stagnation',
      title: t('problems.stagnation.title'),
      subtitle: t('problems.stagnation.subtitle'),
      body: t('problems.stagnation.body'),
      facts: [t('problems.stagnation.fact1'), t('problems.stagnation.fact2')],
      factLinks: {},
      image: '/images/home/figma-refresh/problem-stagnation.webp',
      imageClassName: 'object-[50%_45%]',
    },
  ]

  return (
    <StackCard
      id="about"
      rise={180}
      className="relative z-[2] mt-[96px] rounded-t-[40px] bg-brand-dark-green text-brand-off-white lg:mt-[48px] lg:rounded-t-[100px]"
    >
      <div className="mx-auto max-w-[1440px] px-6 pt-[88px] pb-[200px] lg:px-[130px] lg:pt-[112px] lg:pb-[291px]">
        <SectionHeadingReveal className="mx-auto max-w-[853px] whitespace-normal text-center font-display text-[36px] leading-none tracking-[-0.03em] desktop:whitespace-pre-line">
          {t('heading')}
        </SectionHeadingReveal>
        <div className="mt-14 lg:mt-[74px]">
          <CivilSocietyAccordion items={items} />
        </div>
      </div>
    </StackCard>
  )
}
