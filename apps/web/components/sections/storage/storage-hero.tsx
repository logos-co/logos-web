import type { HeroSection } from '@repo/content/schemas'

import TechStackDetailHero from '@/components/sections/shared/tech-stack-detail-hero'

type Props = {
  data: HeroSection
  backHref: string
}

export default function StorageHero(props: Props) {
  return <TechStackDetailHero {...props} desktopAt1025 />
}
