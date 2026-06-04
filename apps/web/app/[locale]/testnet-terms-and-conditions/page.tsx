import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

const { generateMetadata, Page } = createDocsPage({
  slug: 'testnet-terms-and-conditions',
  path: ROUTES.testnetTermsAndConditions,
  activeKey: 'testnetTerms',
})

export { generateMetadata }
export default Page
