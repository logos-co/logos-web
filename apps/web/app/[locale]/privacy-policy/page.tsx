import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

const { generateMetadata, Page } = createDocsPage({
  namespace: 'pages.privacy',
  path: ROUTES.privacy,
  activeKey: 'privacy',
})

export { generateMetadata }
export default Page
