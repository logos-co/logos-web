import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.book

export const metadata = createRedirectMetadata(TARGET)

export default function FarewellToWestphaliaRedirectPage() {
  return <StaticRedirect target={TARGET} />
}
