import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import { COALITION, EVENT_NAMES } from '../_content'
import { SectionHeading } from './atoms'

/** Logos share one height so each mark reads at a similar size. */
const LOGO_HEIGHT = 28

/**
 * Set like the FAQ block: the page's section heading, then the agenda cards'
 * outline tiles, four to a row on desktop so later partners slot in.
 */
export function Coalition() {
  return (
    <section>
      <ContentWidth>
        <SectionHeading>{COALITION.heading}</SectionHeading>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {COALITION.logos.map((logo) => (
            <li key={logo.name}>
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event-name={EVENT_NAMES.coalitionLink(logo.name)}
                className="flex h-[120px] cursor-pointer items-center justify-center rounded-xl border border-brand-dark-green/50 px-6 transition-opacity hover:opacity-80"
              >
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={Math.round((logo.width / logo.height) * LOGO_HEIGHT)}
                  height={LOGO_HEIGHT}
                  className="h-7 w-auto max-w-full"
                />
              </a>
            </li>
          ))}
        </ul>
      </ContentWidth>
    </section>
  )
}
