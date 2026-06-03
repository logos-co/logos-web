import type {
  CardGridSection,
  CtaPanelSection,
  FeaturedTextSection,
  HeroSection,
  TableSection,
} from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import TechStackBuilderCta from '@/components/sections/shared/tech-stack-builder-cta'
import {
  TechStackDetailPage,
  TechStackDetailSection,
} from '@/components/sections/shared/tech-stack-detail-layout'

import { CapabilitiesSection } from './_sections/capabilities-section'
import { HeroSectionView } from './_sections/hero-section'
import { HowItWorksSection } from './_sections/how-it-works-section'
import { LocalFirstSection } from './_sections/local-first-section'
import { ModularSection } from './_sections/modular-section'

interface BasecampPageProps {
  hero: HeroSection
  howItWorks: TableSection
  localFirst: CtaPanelSection
  modular: FeaturedTextSection
  capabilities: CardGridSection
  resources: CardGridSection
}

export default function BasecampPage({
  hero,
  howItWorks,
  localFirst,
  modular,
  capabilities,
  resources,
}: BasecampPageProps) {
  return (
    <TechStackDetailPage>
      <ContentWidth className="!p-0">
        <HeroSectionView data={hero} />
        <TechStackDetailSection className="md:!mt-0 md:first-of-type:!mt-0">
          <HowItWorksSection data={howItWorks} />
        </TechStackDetailSection>
        <TechStackDetailSection className="!mt-[17px] mb-[48px] md:!mt-[12px] md:mb-[40px]">
          <LocalFirstSection data={localFirst} />
        </TechStackDetailSection>
        <TechStackDetailSection className="!mt-0 md:!mt-0">
          <ModularSection data={modular} />
        </TechStackDetailSection>
        <TechStackDetailSection className="!mt-6 mb-0 md:!mt-6 md:mb-0">
          <CapabilitiesSection data={capabilities} />
        </TechStackDetailSection>
        <TechStackDetailSection className="!mt-0 md:!mt-0">
          <TechStackBuilderCta
            data={resources}
            deckClassName="!pt-0 md:!pt-0"
          />
        </TechStackDetailSection>
      </ContentWidth>
    </TechStackDetailPage>
  )
}
