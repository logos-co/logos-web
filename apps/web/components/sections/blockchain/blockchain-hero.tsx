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
      desktopAt1025
      className="h-[517px]"
    />
  )
}
