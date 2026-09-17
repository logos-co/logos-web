import { DocsNav } from '@/components/sections/shared/docs-toc'
import { ROUTES } from '@/constants/routes'
import { FIELD_STATION_LEGAL_LINKS } from '@/lib/page-legal-links'

const ITEMS = [
  { label: FIELD_STATION_LEGAL_LINKS.label, href: ROUTES.fieldStation },
  ...FIELD_STATION_LEGAL_LINKS.links,
]

/** Side navigation for the Field Station application documents. */
export function FieldStationLegalNav({ activeHref }: { activeHref: string }) {
  return (
    <DocsNav
      label="Field Station legal documents"
      items={ITEMS}
      activeHref={activeHref}
    />
  )
}
