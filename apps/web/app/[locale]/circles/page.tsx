import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.movement

export const metadata = createRedirectMetadata(TARGET)

export default function CirclesRedirectPage() {
  return <StaticRedirect target={TARGET} />
}
