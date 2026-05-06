import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

const { generateMetadata, Page } = createDocsPage({
  namespace: 'pages.security',
  path: ROUTES.security,
  activeKey: 'security',
})

export { generateMetadata }
export default Page
