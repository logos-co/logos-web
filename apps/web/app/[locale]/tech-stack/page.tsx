import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.technologyStack

export const metadata = createRedirectMetadata(TARGET)

export default function TechStackRedirectPage() {
  return <StaticRedirect target={TARGET} />
}
