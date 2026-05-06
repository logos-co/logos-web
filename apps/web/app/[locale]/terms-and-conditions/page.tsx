import { createDocsPage } from '@/components/sections/shared/docs-page-factory'
import { ROUTES } from '@/constants/routes'

const { generateMetadata, Page } = createDocsPage({
  namespace: 'pages.terms',
  path: ROUTES.terms,
  activeKey: 'terms',
})

export { generateMetadata }
export default Page
