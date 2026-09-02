import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.testnetFaqs

export const metadata = createRedirectMetadata(TARGET)

export default function TestnetV01FaqsRedirectPage() {
  return <StaticRedirect target={TARGET} />
}
