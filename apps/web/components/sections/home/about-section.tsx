import type { ReactNode } from 'react'

import type { HomeAboutSection } from '@repo/content/schemas'

import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { StackCard } from '@/components/motion/stack-card'
import { cn } from '@/lib/cn'
import CivilSocietyAccordion, {
  type AccordionClassNames,
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
    <AccordionPanelSection
      id="about"
      heading={data.heading}
      headingMobile={data.headingMobile}
      items={items}
    />
  )
}

const DEFAULT_HEADING_CLASSNAME =
  'mx-auto max-w-[853px] whitespace-pre-line text-center font-display text-[24px] leading-none tracking-[-0.72px] desktop:text-[36px] desktop:tracking-[-0.03em]'
const DEFAULT_LIST_CLASSNAME = 'mt-[112px] lg:mt-[74px]'

interface AccordionPanelSectionProps {
  id: string
  heading: string
  headingMobile?: string
  items: AccordionItem[]
  className?: string
  /** Merged over the inner padding wrapper. */
  contentClassName?: string
  /** Replaces the heading's classes. */
  headingClassName?: string
  /** Replaces the spacing wrapper around the accordion. */
  listClassName?: string
  accordionClassNames?: AccordionClassNames
  accordionIcons?: { open: ReactNode; closed: ReactNode }
  /** Scroll-in rise in px; the homepage stacks cards, other pages can pass 0. */
  rise?: number
}

/**
 * The dark-green rounded panel that holds the homepage accordion. Exported so
 * campaign pages can reuse the same block with their own rows.
 */
export function AccordionPanelSection({
  id,
  heading,
  headingMobile = heading,
  items,
  className,
  contentClassName,
  headingClassName = DEFAULT_HEADING_CLASSNAME,
  listClassName = DEFAULT_LIST_CLASSNAME,
  accordionClassNames,
  accordionIcons,
  rise = 180,
}: AccordionPanelSectionProps) {
  return (
    <StackCard
      id={id}
      rise={rise}
      mobileRise={0}
      className={cn(
        'relative z-[2] mt-3 rounded-t-[40px] bg-brand-dark-green text-brand-off-white lg:mt-[48px] lg:rounded-t-[100px]',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-[1440px] px-3 pt-[112px] pb-[200px] lg:px-[130px] lg:pt-[112px] lg:pb-[291px]',
          contentClassName
        )}
      >
        <SectionHeadingReveal className={headingClassName}>
          <span className="desktop:hidden">{headingMobile}</span>
          <span className="hidden desktop:inline">{heading}</span>
        </SectionHeadingReveal>
        <div className={listClassName}>
          <CivilSocietyAccordion
            items={items}
            classNames={accordionClassNames}
            icons={accordionIcons}
          />
        </div>
      </div>
    </StackCard>
  )
}
