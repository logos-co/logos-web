import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

const { generateMetadata, Page } = createDocsPage({
  slug: 'testnet-faqs',
  path: ROUTES.testnetFaqs,
  activeKey: 'testnetFaqs',
})

export { generateMetadata }
export default Page
