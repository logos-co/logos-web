import ContentWidth from '@/components/layout/content-width'
import { Link } from '@/i18n/navigation'

import { EVENT_NAMES, LEGAL_LINKS } from '../_content'

/** Set like the footer's link lists, in dark ink, under the partner logos. */
export function LegalLinks() {
  return (
    <ContentWidth className="mt-10">
      <ul className="flex flex-col items-start gap-1">
        {LEGAL_LINKS.map((link) => (
          <li key={link.href} className="flex">
            <Link
              href={link.href}
              data-umami-event-name={EVENT_NAMES.legalLink(link.label)}
              className="text-mono-s cursor-pointer border-b border-brand-dark-green/10 text-brand-dark-green transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </ContentWidth>
  )
}
