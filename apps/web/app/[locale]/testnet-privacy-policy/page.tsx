import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

const { generateMetadata, Page } = createDocsPage({
  slug: 'testnet-privacy-policy',
  path: ROUTES.testnetPrivacyPolicy,
  activeKey: 'testnetPrivacy',
})

export { generateMetadata }
export default Page
