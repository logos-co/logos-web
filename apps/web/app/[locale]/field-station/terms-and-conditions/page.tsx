import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

import { FieldStationLegalNav } from '../_legal-nav'

const { generateMetadata, Page } = createDocsPage({
  slug: 'field-station-application-terms',
  path: ROUTES.fieldStationTerms,
  nav: <FieldStationLegalNav activeHref={ROUTES.fieldStationTerms} />,
})

export { generateMetadata }
export default Page
