import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.book

export const generateMetadata = createRedirectMetadata(TARGET)

export default async function FarewellToWestphaliaRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <StaticRedirect target={TARGET} locale={locale} />
}
