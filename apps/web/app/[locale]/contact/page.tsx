import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.home

export const metadata = createRedirectMetadata(TARGET)

export default function ContactRedirectPage() {
  return <StaticRedirect target={TARGET} />
}
