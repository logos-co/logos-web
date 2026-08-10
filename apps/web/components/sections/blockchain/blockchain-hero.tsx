import type { HeroSection } from '@repo/content/schemas'

import TechStackDetailHero from '@/components/sections/shared/tech-stack-detail-hero'

type Props = {
  data: HeroSection
  backHref: string
}

export default function BlockchainHero(props: Props) {
  return (
    <TechStackDetailHero
      {...props}
      actionVariant="tertiary"
      stackActions
      className="min-h-[517px] md:min-h-auto lg:min-h-103.5"
    />
  )
}
