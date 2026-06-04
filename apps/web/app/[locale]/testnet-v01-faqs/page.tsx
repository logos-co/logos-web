import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

const { generateMetadata, Page } = createDocsPage({
  slug: 'testnet-v01-faqs',
  path: ROUTES.testnetV01Faqs,
  activeKey: 'testnetFaqs',
})

export { generateMetadata }
export default Page
