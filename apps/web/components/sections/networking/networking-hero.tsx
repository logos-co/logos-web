import type { HeroSection } from '@repo/content/schemas'

import TechStackDetailHero from '@/components/sections/shared/tech-stack-detail-hero'

type Props = {
  data: HeroSection
  backHref: string
}

/** Six Key Repositories lines need a taller hero than the default min-h-135 on mobile. */
export default function NetworkingHero(props: Props) {
  return (
    <TechStackDetailHero
      {...props}
      className="min-h-170 md:min-h-auto lg:min-h-145"
    />
  )
}
