import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

import { FieldStationLegalNav } from '../_legal-nav'

const { generateMetadata, Page } = createDocsPage({
  slug: 'field-station-privacy-policy',
  path: ROUTES.fieldStationPrivacy,
  nav: <FieldStationLegalNav activeHref={ROUTES.fieldStationPrivacy} />,
})

export { generateMetadata }
export default Page
