import type { HomeAboutSection } from '@repo/content/schemas'

import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { StackCard } from '@/components/motion/stack-card'
import CivilSocietyAccordion, {
  type AccordionItem,
} from './civil-society-accordion'

function createFactLinks(
  factLinks: HomeAboutSection['problems']['debt']['factLinks']
): AccordionItem['factLinks'] {
  return Object.fromEntries(
    (factLinks ?? []).map(({ index, label, href }) => [index, { label, href }])
  )
}

export default function AboutSection({ data }: { data: HomeAboutSection }) {
  const items: AccordionItem[] = [
    {
      key: 'debt',
      title: data.problems.debt.title,
      subtitle: data.problems.debt.subtitle,
      body: data.problems.debt.body,
      facts: data.problems.debt.facts,
      factLinks: createFactLinks(data.problems.debt.factLinks),
      image: '/images/home/figma-refresh/problem-debt.webp',
    },
    {
      key: 'surveillance',
      title: data.problems.surveillance.title,
      subtitle: data.problems.surveillance.subtitle,
      body: data.problems.surveillance.body,
      facts: data.problems.surveillance.facts,
      factLinks: createFactLinks(data.problems.surveillance.factLinks),
      image: '/images/home/figma-refresh/problem-surveillance.webp',
      imageClassName: 'object-[50%_42%]',
    },
    {
      key: 'corruption',
      title: data.problems.corruption.title,
      subtitle: data.problems.corruption.subtitle,
      body: data.problems.corruption.body,
      facts: data.problems.corruption.facts,
      factLinks: createFactLinks(data.problems.corruption.factLinks),
      image: '/images/home/figma-refresh/problem-corruption.webp',
    },
    {
      key: 'stagnation',
      title: data.problems.stagnation.title,
      subtitle: data.problems.stagnation.subtitle,
      body: data.problems.stagnation.body,
      facts: data.problems.stagnation.facts,
      factLinks: createFactLinks(data.problems.stagnation.factLinks),
      image: '/images/home/figma-refresh/problem-stagnation.webp',
      imageClassName: 'object-[50%_45%]',
    },
  ]

  return (
    <StackCard
      id="about"
      rise={180}
      mobileRise={0}
      className="relative z-[2] mt-3 rounded-t-[40px] bg-brand-dark-green text-brand-off-white lg:mt-[48px] lg:rounded-t-[100px]"
    >
      <div className="mx-auto max-w-[1440px] px-3 pt-[112px] pb-[200px] lg:px-[130px] lg:pt-[112px] lg:pb-[291px]">
        <SectionHeadingReveal className="mx-auto max-w-[853px] whitespace-pre-line text-center font-display text-[24px] leading-none tracking-[-0.72px] desktop:text-[36px] desktop:tracking-[-0.03em]">
          <span className="desktop:hidden">{data.headingMobile}</span>
          <span className="hidden desktop:inline">{data.heading}</span>
        </SectionHeadingReveal>
        <div className="mt-[112px] lg:mt-[74px]">
          <CivilSocietyAccordion items={items} />
        </div>
      </div>
    </StackCard>
  )
}
