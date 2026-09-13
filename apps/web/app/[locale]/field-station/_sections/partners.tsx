import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'

import {
  ProgramImagePanel,
  ProgramOutlinePanel,
  ProgramPanelsSection,
} from '@/components/sections/shared/developer-programs-section'

import { EVENT_NAMES, PARTNERS } from '../_content'

/** Figma draws the mark 17.55px tall. */
const LOGOS_MARK_HEIGHT = 17.55

/**
 * Figma's 24px top padding includes the 1px hairline it strokes inside the
 * frame; the CSS border sits outside the padding, so the padding is 23px.
 */
export function Partners() {
  const { logos, zuGrama } = PARTNERS

  return (
    <ProgramPanelsSection className="mt-28 border-t border-brand-dark-green/10 pt-[23px] pb-25">
      <ProgramImagePanel
        link={{
          href: logos.href,
          ariaLabel: 'Logos homepage',
          eventName: EVENT_NAMES.partnerLogos,
        }}
        image={logos.image}
        mark={<LogosMark size={LOGOS_MARK_HEIGHT} className="relative" />}
        title={logos.title}
        description={logos.description}
      />
      <ProgramOutlinePanel
        link={{
          href: zuGrama.href,
          ariaLabel: 'Zu-Grama website (opens in a new tab)',
          eventName: EVENT_NAMES.partnerZuGrama,
        }}
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
        actions={
          <a
            href={zuGrama.x.href}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event-name={EVENT_NAMES.partnerZuGramaX}
            className="cursor-pointer underline underline-offset-2"
          >
            {zuGrama.x.label}
          </a>
        }
      />
    </ProgramPanelsSection>
  )
}
