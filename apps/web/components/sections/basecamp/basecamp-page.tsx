import type {
  CardGridSection,
  CtaPanelSection,
  FeaturedTextSection,
  HeroSection,
  TableSection,
} from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import {
  TechStackDetailPage,
  TechStackDetailSection,
} from '@/components/sections/shared/tech-stack-detail-layout'

import { CapabilitiesSection } from './_sections/capabilities-section'
import { HeroSectionView } from './_sections/hero-section'
import { HowItWorksSection } from './_sections/how-it-works-section'
import { LocalFirstSection } from './_sections/local-first-section'
import { ModularSection } from './_sections/modular-section'
import { ResourcesSection } from './_sections/resources-section'

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
        <TechStackDetailSection>
          <HowItWorksSection data={howItWorks} />
        </TechStackDetailSection>
        <TechStackDetailSection>
          <LocalFirstSection data={localFirst} />
        </TechStackDetailSection>
        <TechStackDetailSection>
          <ModularSection data={modular} />
        </TechStackDetailSection>
        <TechStackDetailSection>
          <CapabilitiesSection data={capabilities} />
        </TechStackDetailSection>
        <TechStackDetailSection>
          <ResourcesSection data={resources} />
        </TechStackDetailSection>
      </ContentWidth>
    </TechStackDetailPage>
  )
}
