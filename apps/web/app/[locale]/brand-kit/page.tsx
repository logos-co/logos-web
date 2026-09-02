import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.designGuide

export const metadata = createRedirectMetadata(TARGET)

export default function BrandKitRedirectPage() {
  return <StaticRedirect target={TARGET} />
}
