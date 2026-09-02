import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.home

export const generateMetadata = createRedirectMetadata(TARGET)

export default async function ContactRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <StaticRedirect target={TARGET} locale={locale} />
}
