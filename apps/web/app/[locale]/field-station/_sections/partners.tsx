import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'

import {
  ProgramImagePanel,
  ProgramOutlinePanel,
  ProgramPanelsSection,
} from '@/components/sections/shared/developer-programs-section'

import { PARTNERS } from '../_content'

/** Figma draws the mark 17.55px tall. */
const LOGOS_MARK_HEIGHT = 17.55

export function Partners() {
  const { logos, zuGrama } = PARTNERS

  return (
    <ProgramPanelsSection className="mt-28 border-t border-brand-dark-green/10 pt-6 pb-25">
      <ProgramImagePanel
        image={logos.image}
        mark={<LogosMark size={LOGOS_MARK_HEIGHT} className="relative" />}
        title={logos.title}
        description={logos.description}
      />
      <ProgramOutlinePanel
        mark={
          <Image
            src={zuGrama.logo.src}
            alt={zuGrama.logo.alt}
            width={zuGrama.logo.width}
            height={zuGrama.logo.height}
          />
        }
        title={zuGrama.title}
        description={zuGrama.description}
      />
    </ProgramPanelsSection>
  )
}
