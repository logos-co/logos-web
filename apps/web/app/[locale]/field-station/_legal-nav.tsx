import { DocsNav } from '@/components/sections/shared/docs-toc'
import { ROUTES } from '@/constants/routes'

import { LEGAL_LINKS } from './_content'

const ITEMS = [
  { label: 'Field Station', href: ROUTES.fieldStation },
  ...LEGAL_LINKS,
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
